import mongoose, { Schema } from "mongoose";
import { FILE_TYPES, MESSAGE_TYPES } from "../utils/constants.js";

const fileSchema = new Schema(
  {
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: FILE_TYPES,
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const messageSchema = new Schema({
  chatId: {
    type: Schema.Types.ObjectId,
    ref: "Chat",
    required: true,
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: function () {
      return this.messageType === "text";
    },
  },
  messageType: {
    type: String,
    enum: MESSAGE_TYPES,
    default: "text",
  },
  deliveryStatus: {
    type: String,
    enum: ['sent', 'delivered', 'seen'],
    default: 'sent',
  },
  attachments: [fileSchema],
  createdAt: {
    type: Date,
    required: true,
  },
});

messageSchema.index({ chatId: 1, createdAt: 1 });
messageSchema.index({ senderId: 1 });

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
