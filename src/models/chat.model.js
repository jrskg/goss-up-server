import mongoose, { Schema } from "mongoose";
import { CHAT_TYPES } from "../utils/constants.js";

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
    groupIcon: {
      image: String,
      publicId: String,
      avatar: String,
    },
    admins: [{ type: Schema.Types.ObjectId, ref: "User" }],
    lastMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

// chatSchema.index({ chatType: 1 });
chatSchema.index({ participants: 1 });
chatSchema.index({ chatType: 1, participants: 1 });
chatSchema.index({ chatType: 1, participants: 1, groupName: 1 });

chatSchema.pre("save", async function (next) {
  if (this.chatType === "one-to-one") {
    let participants = [...this.participants];
    if (participants[0].toString() > participants[1].toString()) {
      [participants[0], participants[1]] = [participants[1], participants[0]];
    }
    this.participants = participants;
  }
  next();
});

const Chat = mongoose.model("Chat", chatSchema);
export { Chat };
