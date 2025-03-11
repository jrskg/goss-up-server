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
export const KAFKA_NOTIFICATION_GROUP_ID = "kafka-notification-group-id";
export const KAFKA_MESSAGE_TOPIC = "kafka-message-topic";
export const KAFKA_MESSAGE_GROUP_ID = "kafka-message-group-id";
export const KAFKA_INSERT_EVENT = "insert_message";
export const KAFKA_UPDATE_EVENT = "update_status";

export const MESSAGE_TYPES = ["text", "file"];
export const FILE_TYPES = ["image", "video", "audio", "other"];
export const CHAT_TYPES = ["one-to-one", "group"]

export const SOCKET_EVENTS_SERVER = {
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  SEND_MESSAGE: "send_message",
  NEW_MESSAGE: "new_message",
  USER_TYPING: "user_typing",
  USER_STOP_TYPING: "user_stop_typing",
  MESSAGE_STATUS_UPDATE: "message_status_update",
  // MESSAGE_STATUS_UPDATE_BULK: "message_status_update_bulk",

  CHAT_NAME_ICON_UPDATE: "chat_name_icon_update",
  TOGGLE_ADMIN: "toggle_admin",
  REMOVED_PARTICIPANT: "removed_participant",
  CREATE_OR_ADD_PARTICIPANTS: "create_or_add_participants",
  LEAVE_GROUP: "leave_group",
  
  USER_ONLINE: "user_online",
  USER_OFFLINE: "user_offline",
  USER_JOINED: "user_joined",
  USER_LEFT: "user_left",
};
