import mongoose, { Schema} from "mongoose";
import { CHAT_TYPES } from "../utils/constants";

const chatSchema = new Schema(
  {
    chatType: {
      type: String,
      enum: CHAT_TYPES,
      default: "one-to-one",
    },
    participants: [
      { type: Schema.Types.ObjectId, ref: "User", required: true },
    ],
    groupName: {
      type: String,
      required: function () {
        return this.chatType === "group";
      },
    },
    admin: [{ type: Schema.Types.ObjectId, ref: "User" }],
    lastMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    }
  },
  { timestamps: true }
);

chatSchema.index({ participants: 1 });
chatSchema.index({ chatType: 1 });
chatSchema.index({ chatType: 1, participants: 1 });

const Chat = mongoose.model("Chat", chatSchema);
module.exports = Chat;
