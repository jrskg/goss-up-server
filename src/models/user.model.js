import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_EXPIRES, JWT_SECRET } from "../configs/env.index.js";
import { DEFAULT_BIO } from "../utils/constants.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      default: DEFAULT_BIO,
    },
    profilePic: {
      image: String,
      publicId: String,
      avatar: String,
    },
    status: {
      type: String,
      enum: ["online", "offline"],
      default: "online",
    },
    pushTokens: [
      {
        token: {
          type: String,
        },
        platform: {
          type: String,
          enum: ["web", "android", "ios"],
        },
      },
    ],
    settings: {
      notificationEnabled: {
        type: Boolean,
        default: true,
      },
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },
      soundEnabled: {
        type: Boolean,
        default: true,
      },
    },
    lastSeen: {
      type: Date, 
      default: Date.now,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verificationAndResetToken: {
      type: String,
    },
    verificationAndResetTokenExpires: {
      type: Date,
    },
    resetTokenStatus: {
      type: String,
      default: "unset",
      enum: ["unset", "verified", "unverified"],
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateJWTToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES,
    }
  );
};

export const User = mongoose.model("User", userSchema);
