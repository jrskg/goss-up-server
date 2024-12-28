import {Server} from "socket.io";
import { SOCKET_EVENTS_SERVER } from "../utils/constants.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../configs/env.index.js";

class SocketService{
  userSocketMap = new Map();
  constructor(){
    console.log("Socket service initialized");
    this.io = new Server({
      cors: {
        allowedHeaders:["*"],
        origin:"*",
      },
      transports: ["websocket"],
    });

    this.io.use((socket, next) => {
      const cookies = socket.handshake.headers.cookie;
      if(!cookies){
        next(new Error("Not authorized"));
        return
      }
      const token = cookies.split("=")[1];
      if(!token){
        next(new Error("Not authorized"));
        return
      }
      const userData = jwt.verify(token, JWT_SECRET);
      socket.user = userData;
      if(!this.userSocketMap.has(userData._id)){
        this.userSocketMap.set(userData._id, []);
      }
      this.userSocketMap.get(userData._id).push(socket);
      next();
    })
  }
  initializeListeners(){
    console.log("Socket listeners initialized");
    const io = this.io;
    io.on("connection", (socket) => {
      console.info("a user connected", socket.id, socket.user.name);
      socket.on(SOCKET_EVENTS_SERVER.JOIN_ROOM, (payload) => {
        const {currRoomId, prevRoomId} = payload;
        if(prevRoomId) {socket.leave(prevRoomId); console.log("Leaved room", prevRoomId)}
        console.log("Joined room", currRoomId, socket.user.name);
        socket.join(currRoomId);
      });

      socket.on(SOCKET_EVENTS_SERVER.LEAVE_ROOM, (payload) => {
        const {roomId} = payload;
        console.log("Left room", roomId, socket.user.name);
        socket.leave(roomId);
      });

      socket.on(SOCKET_EVENTS_SERVER.SEND_MESSAGE, (payload) => {
        const {roomId, message, participants, senderId} = payload;
        socket.to(roomId).emit(SOCKET_EVENTS_SERVER.USER_STOP_TYPING, {roomId, userId: senderId, name: socket.user.name});
        // socket.to(roomId).emit(SOCKET_EVENTS_SERVER.NEW_MESSAGE, {roomId, message});
        participants.forEach(p => {
          if(p !== senderId){
            const sockets = this.userSocketMap.get(p) || [];
            sockets.forEach(s => {
              s.emit(SOCKET_EVENTS_SERVER.NEW_MESSAGE, {roomId, message});
            })
          }
        });
      });

      socket.on(SOCKET_EVENTS_SERVER.USER_TYPING, (payload) => {
        console.log("User typing", payload.name);
        const {roomId, userId, name} = payload;
        socket.to(roomId).emit(SOCKET_EVENTS_SERVER.USER_TYPING, {roomId, name, userId});
      });

      socket.on(SOCKET_EVENTS_SERVER.USER_STOP_TYPING, (payload) => {
        const {roomId, userId, name} = payload;
        socket.to(roomId).emit(SOCKET_EVENTS_SERVER.USER_STOP_TYPING, {roomId, name, userId});
      });

      socket.on("error", (err) => {
        console.log(err);
      });

      socket.on("disconnect", () => {
        console.log("user disconnected", socket.id);
        if(!socket.user || !socket.user._id){
          console.log("User not found on socket");
          return;
        }
        const userId = socket.user._id;
        const allSockets = this.userSocketMap.get(userId) || [];
        const updatedSockets = allSockets.filter(s => s.id !== socket.id);
        if(updatedSockets.length === 0){
          this.userSocketMap.delete(userId);
        }
        else{
          this.userSocketMap.set(userId, updatedSockets);
        }
        const joinedRooms = socket.rooms;
        for (const room of joinedRooms) {
          socket.leave(room);
        }
      });
    })
  }
}

export default SocketService;