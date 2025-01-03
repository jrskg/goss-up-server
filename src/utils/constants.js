export const DB_NAME = "goss-up";

export const DEFAULT_BIO = "Hey there! I am using Goss-up to stay connected with friends.";

export const OK = 200;
export const CREATED = 201;
export const BAD_REQUEST = 400;
export const UNAUTHORIZED = 401;
export const NOT_FOUND = 404;
export const CONFLICT = 409;
export const INTERNAL_SERVER_ERROR = 500;

export const PUSH_PLATFORMS = ["web", "android", "ios"];
export const THEME = ["light", "dark"];

export const CLN_PROFILE_FOLDER = "gossup_profile";
export const CLN_CHATICON_FOLDER = "gossup_chaticon";

export const NOTIFICATION_TYPES = ["message", "friend_request", "group_invite"];

export const KAFKA_NOTIFICATION_TOPIC = "kafka-notification-topic";
export const KAFKA_MESSAGE_TOPIC = "kafka-message-topic";

export const MESSAGE_TYPES = ["text", "file"];
export const FILE_TYPES = ["image", "video", "audio", "other"];
export const CHAT_TYPES = ["one-to-one", "group"]

export const SOCKET_EVENTS_SERVER = {
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  SEND_MESSAGE: "send_message",
  NEW_MESSAGE: "new_message",
  USER_JOINED: "user_joined",
  USER_LEFT: "user_left",
  USER_TYPING: "user_typing",
  USER_STOP_TYPING: "user_stop_typing",
  USER_ONLINE: "user_online",
  USER_OFFLINE: "user_offline"
};
