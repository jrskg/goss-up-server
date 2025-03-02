import { JWT_SECRET } from "../configs/env.index.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const authenticate = asyncHandler(async (req, _, next) => {
  const token =
    req.cookies?.token ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorize request");
  }

  try {
    const jwtData = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(jwtData?._id).select("+password").lean();
  
    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }
  
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    throw new ApiError(401, "Invalid access token");
  }
});
