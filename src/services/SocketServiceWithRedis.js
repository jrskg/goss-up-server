import { Server } from "socket.io";
import {
  KAFKA_INSERT_EVENT,
  KAFKA_MESSAGE_TOPIC,
  KAFKA_UPDATE_EVENT,
  SOCKET_EVENTS_SERVER,
} from "../utils/constants.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../configs/env.index.js";
import { pub, sub } from "../configs/redis.js";
import { produceMessageAndUpdates } from "../configs/kafka.js";

const REDIS_SOCKET_EVENT_CHANNEL = "redis_socket_event_channel";

class SocketService {
  userSocketMap = new Map();
  constructor() {
    console.log("Socket service initialized");
    this.io = new Server({
      cors: {
        allowedHeaders: ["*"],
        origin: "*",
      },
      transports: ["websocket"],
    });

    sub.subscribe(REDIS_SOCKET_EVENT_CHANNEL);

    sub.on("message", (channel, message) => {
      if (channel === REDIS_SOCKET_EVENT_CHANNEL) {
        try {
          const data = JSON.parse(message);
          switch (data.event) {
            //for participants based events
            case SOCKET_EVENTS_SERVER.NEW_MESSAGE:
            case SOCKET_EVENTS_SERVER.CHAT_NAME_ICON_UPDATE:
            case SOCKET_EVENTS_SERVER.TOGGLE_ADMIN:
            case SOCKET_EVENTS_SERVER.LEAVE_GROUP:
            case SOCKET_EVENTS_SERVER.REMOVED_PARTICIPANT:
            case SOCKET_EVENTS_SERVER.CREATE_OR_ADD_PARTICIPANTS:
              this.broadcastToParticipants(
                data.event,
                data.payload,
                data.senderId,
                data.participants
              );
              break;

            //for room based events
            case SOCKET_EVENTS_SERVER.USER_TYPING:
            case SOCKET_EVENTS_SERVER.USER_STOP_TYPING:
              this.io.to(data.roomId).emit(data.event, data.payload);
              break;

            //for update messages status
            case SOCKET_EVENTS_SERVER.MESSAGE_STATUS_UPDATE:
              const senderIdMessageMap = {};
              data.messages.forEach((m) => {
                if (!senderIdMessageMap[m.senderId]) {
                  senderIdMessageMap[m.senderId] = [];
                }
                senderIdMessageMap[m.senderId].push(m);
              });
              Object.entries(senderIdMessageMap).forEach(
                ([senderId, messages]) => {
                  const sockets = this.userSocketMap.get(senderId) || [];
                  sockets.forEach((s) => {
                    s.emit(
                      SOCKET_EVENTS_SERVER.MESSAGE_STATUS_UPDATE,
                      messages
                    );
                  });
                }
              );
              break;
            default:
              console.warn("Unhandled redis error.", data.event);
          }
        } catch (error) {
          console.error("Error processing Redis message:", error);
        }
      }
    });

    this.io.use((socket, next) => {
      const cookies = socket.handshake.headers.cookie;
      if (!cookies) {
        next(new Error("Not authorized"));
        return;
      }
      const token = cookies.split("=")[1];
      if (!token) {
        next(new Error("Not authorized"));
        return;
      }
      try {
        const userData = jwt.verify(token, JWT_SECRET);
        socket.user = userData;
        if (!this.userSocketMap.has(userData._id)) {
          this.userSocketMap.set(userData._id, []);
        }
        this.userSocketMap.get(userData._id).push(socket);
        next();
      } catch (error) {
        next(new Error("Not authorized"));
      }
    });
  }

  broadcastToParticipants(event, payload, senderId, participants) {
    participants.forEach((p) => {
      if (p !== senderId) {
        const sockets = this.userSocketMap.get(p) || [];
        sockets.forEach((s) => {
          s.emit(event, payload);
        });
      }
    });
  }
  initializeListeners() {
    console.log("Socket listeners initialized");
    const io = this.io;
    io.on("connection", (socket) => {
      console.info("a user connected", socket.id, socket.user.name);
      socket.on(SOCKET_EVENTS_SERVER.JOIN_ROOM, (payload) => {
        const { currRoomId, prevRoomId } = payload;
        if (prevRoomId) {
          socket.leave(prevRoomId);
          console.log("Leaved room", prevRoomId);
        }
        console.log("Joined room", currRoomId, socket.user.name);
        socket.join(currRoomId);
      });

      socket.on(SOCKET_EVENTS_SERVER.LEAVE_ROOM, (payload) => {
        const { roomId } = payload;
        console.log("Left room", roomId, socket.user.name);
        socket.leave(roomId);
      });

      socket.on(SOCKET_EVENTS_SERVER.SEND_MESSAGE, async (payload) => {
        const { roomId, message, participants, senderId } = payload;

        pub.publish(
          REDIS_SOCKET_EVENT_CHANNEL,
          JSON.stringify({
            event: SOCKET_EVENTS_SERVER.USER_STOP_TYPING,
            payload: { roomId, userId: senderId, name: socket.user.name },
            roomId,
          })
        );

        pub.publish(
          REDIS_SOCKET_EVENT_CHANNEL,
          JSON.stringify({
            event: SOCKET_EVENTS_SERVER.NEW_MESSAGE,
            payload: { roomId, message },
            participants,
            senderId,
          })
        );
        //process putting messages to kafka here
        await produceMessageAndUpdates(KAFKA_MESSAGE_TOPIC, {
          event: KAFKA_INSERT_EVENT,
          data: message,
        });
      });

      socket.on(SOCKET_EVENTS_SERVER.USER_TYPING, (payload) => {
        pub.publish(
          REDIS_SOCKET_EVENT_CHANNEL,
          JSON.stringify({
            event: SOCKET_EVENTS_SERVER.USER_TYPING,
            payload,
            roomId: payload.roomId,
          })
        );
      });

      socket.on(SOCKET_EVENTS_SERVER.USER_STOP_TYPING, (payload) => {
        pub.publish(
          REDIS_SOCKET_EVENT_CHANNEL,
          JSON.stringify({
            event: SOCKET_EVENTS_SERVER.USER_STOP_TYPING,
            payload,
            roomId: payload.roomId,
          })
        );
      });

      socket.on(SOCKET_EVENTS_SERVER.MESSAGE_STATUS_UPDATE, (payload) => {
        // console.log("Message status update", payload);
        pub.publish(
          REDIS_SOCKET_EVENT_CHANNEL,
          JSON.stringify({
            event: SOCKET_EVENTS_SERVER.MESSAGE_STATUS_UPDATE,
            messages: payload,
          })
        );
        payload.forEach(async (m) => {
          const data = {
            event: KAFKA_UPDATE_EVENT,
            data: {
              _id: m.messageId,
              deliveryStatus: m.status,
            },
          };
          await produceMessageAndUpdates(KAFKA_MESSAGE_TOPIC, data);
        });
      });

      //for chat details updates and create group or add participants
      socket.on(SOCKET_EVENTS_SERVER.CHAT_NAME_ICON_UPDATE, (payload) => {
        const { updatedChat } = payload;
        pub.publish(
          REDIS_SOCKET_EVENT_CHANNEL,
          JSON.stringify({
            event: SOCKET_EVENTS_SERVER.CHAT_NAME_ICON_UPDATE,
            payload,
            participants: updatedChat.participants,
            senderId: socket.user._id,
          })
        );
      });

      socket.on(SOCKET_EVENTS_SERVER.TOGGLE_ADMIN, (payload) => {
        const { chatId, participantId, participants } = payload;
        pub.publish(
          REDIS_SOCKET_EVENT_CHANNEL,
          JSON.stringify({
            event: SOCKET_EVENTS_SERVER.TOGGLE_ADMIN,
            payload: { chatId, participantId },
            participants,
            senderId: socket.user._id,
          })
        );
      });

      socket.on(SOCKET_EVENTS_SERVER.REMOVED_PARTICIPANT, (payload) => {
        const { chatId, participantId, participants } = payload;
        pub.publish(
          REDIS_SOCKET_EVENT_CHANNEL,
          JSON.stringify({
            event: SOCKET_EVENTS_SERVER.REMOVED_PARTICIPANT,
            payload: { chatId, participantId },
            participants,
            senderId: socket.user._id,
          })
        );
      });

      socket.on(SOCKET_EVENTS_SERVER.LEAVE_GROUP, (payload) => {
        const { chatId, updatedChat } = payload;
        pub.publish(
          REDIS_SOCKET_EVENT_CHANNEL,
          JSON.stringify({
            event: SOCKET_EVENTS_SERVER.LEAVE_GROUP,
            payload: { chatId, updatedChat },
            participants: updatedChat.participants,
            senderId: socket.user._id,
          })
        );
      });

      socket.on(SOCKET_EVENTS_SERVER.CREATE_OR_ADD_PARTICIPANTS, (payload) => {
        const { participants } = payload;
        pub.publish(
          REDIS_SOCKET_EVENT_CHANNEL,
          JSON.stringify({
            event: SOCKET_EVENTS_SERVER.CREATE_OR_ADD_PARTICIPANTS,
            payload,
            participants,
            senderId: socket.user._id,
          })
        );
      });

      socket.on("error", (err) => {
        console.error(err);
      });

      socket.on("disconnect", () => {
        console.log("user disconnected", socket.id);
        if (!socket.user || !socket.user._id) {
          console.log("User not found on socket");
          return;
        }
        const userId = socket.user._id;
        const allSockets = this.userSocketMap.get(userId) || [];
        const updatedSockets = allSockets.filter((s) => s.id !== socket.id);
        if (updatedSockets.length === 0) {
          this.userSocketMap.delete(userId);
        } else {
          this.userSocketMap.set(userId, updatedSockets);
        }
        const joinedRooms = socket.rooms;
        for (const room of joinedRooms) {
          socket.leave(room);
        }
      });
    });
  }
}

export default SocketService;
