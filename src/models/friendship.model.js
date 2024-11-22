import mongoose from "mongoose";
const friendshipSchema = new mongoose.Schema({
  userOneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userTwoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  requestSenderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }
}, { timestamps: true });

// Index for efficient lookups based on userOneId and userTwoId
friendshipSchema.index({ userOneId: 1, userTwoId: 1 }, { unique: true });

// Index for querying on individual users (one-to-many relationships)
friendshipSchema.index({ userOneId: 1 });
friendshipSchema.index({ userTwoId: 1 });

// Normalize userOneId and userTwoId before saving
friendshipSchema.pre("save", function (next) {
  if (this.userOneId.toString() > this.userTwoId.toString()) {
    [this.userOneId, this.userTwoId] = [this.userTwoId, this.userOneId];
  }
  next();
});

export const Friendship = mongoose.model("Friendship", friendshipSchema);
