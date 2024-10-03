import { FRONTEND_URL, JWT_SECRET } from "../configs/env.index.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import {
  BAD_REQUEST,
  CLN_PROFILE_FOLDER,
  CREATED,
  INTERNAL_SERVER_ERROR,
  OK,
  PUSH_PLATFORMS,
  THEME,
} from "../utils/constants.js";
import { cookieOptions, sendEmail, sendToken } from "../utils/utility.js";
import jwt from "jsonwebtoken";

export const registerUser = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;
  if ([name, email, password].some((field) => !field || field.trim() === "")) {
    return new ApiError(
      BAD_REQUEST,
      "Feels like you forgot to fill in some fields"
    );
  }
  let user = await User.findOne({ email });
  if (user) {
    return next(new ApiError(BAD_REQUEST, "This email is already registered"));
  }

  user = await User.create({ name, email, password });
  if (!user) {
    return next(new ApiError(INTERNAL_SERVER_ERROR, "Something went wrong!!"));
  }
  const verificationToken = jwt.sign({ _id: user._id }, JWT_SECRET, {
    expiresIn: "5m",
  });
  user.verificationAndResetToken = verificationToken;
  user.verificationAndResetTokenExpires = Date.now() + 5 * 60 * 1000;
  await user.save();
  await sendEmail({
    toEmail: user.email,
    subject: "Email Verification",
    link: `${FRONTEND_URL}/verify/${verificationToken}`,
    description:
      'Please click on the "Verify Email" button to verify your email',
    btnText: "Verify Email",
  });
  res.status(CREATED).json(
    new ApiResponse(CREATED, "Welcome to GOSS-UP, Let's Chat :)", {
      beginVerification: true,
    })
  );
});

export const requestVerificationEmail = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ApiError(BAD_REQUEST, "User not found"));
  }
  const verificationToken = jwt.sign({ _id: user._id }, JWT_SECRET, {
    expiresIn: "5m",
  });
  user.verificationAndResetToken = verificationToken;
  user.verificationAndResetTokenExpires = Date.now() + 5 * 60 * 1000;
  await user.save();
  await sendEmail({
    toEmail: user.email,
    subject: "Email Verification",
    link: `${FRONTEND_URL}/verify/${verificationToken}`,
    description:
      'Please click on the "Verify Email" button to verify your email',
    btnText: "Verify Email",
  });
  res
    .status(CREATED)
    .json(new ApiResponse(CREATED, "Verification link sent to your email"));
});

export const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  if (!token) {
    return next(new ApiError(BAD_REQUEST, "Invalid or Expired token"));
  }
  const { _id } = jwt.verify(token, JWT_SECRET);
  const user = await User.findOne({
    _id,
    verificationAndResetToken: token,
    verificationAndResetTokenExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ApiError(BAD_REQUEST, "Invalid or Expired token"));
  }
  user.verified = true;
  user.verificationAndResetToken = undefined;
  user.verificationAndResetTokenExpires = undefined;
  await user.save();
  sendToken(user, CREATED, res, "Email verified successfully");
});

export const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password, pushOptions } = req.body;
  if ([email, password].some((field) => !field || field.trim() === "")) {
    return next(new ApiError(BAD_REQUEST, "Please provide email and password"));
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ApiError(BAD_REQUEST, "Invalid credentials"));
  }
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    return next(new ApiError(BAD_REQUEST, "Invalid credentials"));
  }
  if (!user.verified) {
    const jwtToken = await user.generateJWTToken();
    return res
    .status(OK)
    .cookie("token", jwtToken, {
      ...cookieOptions(),
      expires: new Date(Date.now() + 5 * 60 * 1000),
    })
    .json(
      new ApiResponse(OK, "Please verify your email", {
        beginVerification: true,
      })
    );
  }
  let pushTokens = user.pushTokens || [];
  if (pushOptions && Object.keys(pushOptions).length > 0) {
    const { token, platform } = pushOptions;
    if (!PUSH_PLATFORMS.includes(platform)) {
      return next(
        new ApiError(BAD_REQUEST, "Invalid platform for push notifications")
      );
    }
    pushTokens = pushTokens.filter((token) => token.platform !== platform);
    pushTokens.push({ token, platform });
  }
  user.pushTokens = pushTokens;
  await user.save();
  sendToken(user, OK, res, "Login successful");
});

export const loadUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select(
    "-password -__v -pushTokens -verificationAndResetToken -verificationAndResetTokenExpires"
  );
  if (!user) {
    return next(new ApiError(BAD_REQUEST, "User not found"));
  }
  if (!user.verified) {
    return res.status(OK).json(
      new ApiResponse(OK, "Please verify your email", {
        beginVerification: true,
      })
    );
  }
  res.status(OK).json(new ApiResponse(OK, "User fetched", user));
});

export const logoutUser = asyncHandler(async (req, res, next) => {
  const { platform } = req.body;
  if (!platform || !PUSH_PLATFORMS.includes(platform)) {
    return next(
      new ApiError(BAD_REQUEST, "Invalid platform for push notifications")
    );
  }
  const user = await User.findById(req.user._id);
  const pushTokens = user.pushTokens.filter(
    (token) => token.platform !== req.body.platform
  );
  user.pushTokens = pushTokens;
  await user.save();
  res
    .status(OK)
    .cookie("token", null, {
      expires: new Date(Date.now()),
    })
    .json(new ApiResponse(OK, "Logout successful"));
});

export const addProfilePicture = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ApiError(BAD_REQUEST, "Please provide profile picture"));
  }
  const { path: picLocalPath } = req.file;
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ApiError(BAD_REQUEST, "User not found"));
  }
  const previousProfile = user.profilePic ? user.profilePic.publicId : null;
  const response = await uploadOnCloudinary(picLocalPath, CLN_PROFILE_FOLDER);
  if (!response) {
    return next(new ApiError(BAD_REQUEST, "Failed to upload profile picture"));
  }
  user.profilePic = response;
  await user.save();
  if (previousProfile) {
    await deleteFromCloudinary(previousProfile);
  }
  res
    .status(OK)
    .json(new ApiResponse(OK, "Profile picture uploaded", response));
});

export const updateBio = asyncHandler(async (req, res, next) => {
  const { bio } = req.body;
  if (!bio || bio.trim() === "") {
    return next(new ApiError(BAD_REQUEST, "Please provide bio"));
  }
  await User.findByIdAndUpdate(req.user._id, { bio }, { new: true });
  res.status(OK).json(new ApiResponse(OK, "Bio updated"));
});

export const addPushToken = asyncHandler(async (req, res, next) => {
  const { token, platform } = req.body;
  if (!PUSH_PLATFORMS.includes(platform)) {
    return next(
      new ApiError(BAD_REQUEST, "Invalid platform for push notifications")
    );
  }
  if (!token || token.trim() === "") {
    return next(new ApiError(BAD_REQUEST, "Please provide token"));
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ApiError(BAD_REQUEST, "User not found"));
  }
  let pushTokens = user.pushTokens || [];
  pushTokens = pushTokens.filter((token) => token.platform !== platform);
  pushTokens.push({ token, platform });
  user.pushTokens = pushTokens;
  await user.save();
  res
    .status(OK)
    .json(new ApiResponse(OK, "Hurrah! Now you can receive notifications"));
});

export const updateSettings = asyncHandler(async (req, res, next) => {
  const { notificationEnabled, theme, soundEnabled } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ApiError(BAD_REQUEST, "User not found"));
  }
  const updatedSettings = {...user.settings};
  if (typeof notificationEnabled === "boolean")
    updatedSettings.notificationEnabled = notificationEnabled;
  if (THEME.includes(theme)) updatedSettings.theme = theme;
  if (typeof soundEnabled === "boolean")
    updatedSettings.soundEnabled = soundEnabled;
  if (Object.keys(updatedSettings).length === 0) {
    res.status(OK).json(new ApiResponse(OK, "No settings to update"));
    return;
  }  
  await User.findByIdAndUpdate(
    req.user._id,
    { settings: updatedSettings },
    { new: true }
  );
  res.status(OK).json(new ApiResponse(OK, "Settings updated"));
});

export const getSettings = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ApiError(BAD_REQUEST, "User not found"));
  }
  res.status(OK).json(new ApiResponse(OK, "Settings fetched", user.settings));
});

export const updateName = asyncHandler(async (req, res, next) => {
  const { name } = req.body;
  if (!name || name.trim() === "") {
    return next(new ApiError(BAD_REQUEST, "Please provide name"));
  }
  await User.findByIdAndUpdate(req.user._id, { name }, { new: true });
  res.status(OK).json(new ApiResponse(OK, "Name updated"));
});

export const changePassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  if (
    [oldPassword, newPassword].some(
      (password) => !password || password.trim() === ""
    )
  ) {
    return next(
      new ApiError(BAD_REQUEST, "Please provide old and new password")
    );
  }
  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    return next(new ApiError(BAD_REQUEST, "User not found"));
  }
  const isMatch = await user.isPasswordCorrect(oldPassword);
  if (!isMatch) {
    return next(new ApiError(BAD_REQUEST, "Incorrect old password"));
  }
  user.password = newPassword;
  await user.save();
  res.status(OK).json(new ApiResponse(OK, "Password changed"));
});

export const forgetPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email || email.trim() === "") {
    return next(new ApiError(BAD_REQUEST, "Please provide email"));
  }
  const user = await User.findOne({ email });
  if (!user) {
    return next(new ApiError(BAD_REQUEST, "User not found"));
  }
  const resetToken = jwt.sign({ _id: user._id }, JWT_SECRET, {
    expiresIn: "5m",
  });
  user.verificationAndResetToken = resetToken;
  user.verificationAndResetTokenExpires = Date.now() + 5 * 60 * 1000;
  user.resetTokenStatus = "unverified";
  await user.save();
  const link = `${FRONTEND_URL}/password/reset/${resetToken}`;
  await sendEmail({
    toEmail: user.email,
    subject: "Reset Password",
    link,
    description: "Click on the link below to reset your password",
    btnText: "Reset Password",
  });
  res
    .status(OK)
    .json(new ApiResponse(OK, "Password reset link sent to your email"));
});

export const verifyResetToken = asyncHandler(async (req, res, next) => {
  const { verificationAndResetToken } = req.body;
  if (!verificationAndResetToken || verificationAndResetToken.trim() === "") {
    return next(new ApiError(BAD_REQUEST, "Please provide token"));
  }
  const user = await User.findOne({
    verificationAndResetToken: verificationAndResetToken,
    verificationAndResetTokenExpires: { $gt: Date.now() },
    resetTokenStatus: "unverified",
  });
  if (!user) {
    return next(new ApiError(BAD_REQUEST, "Invalid token"));
  }
  user.resetTokenStatus = "verified";
  await user.save();
  res
    .status(OK)
    .json(new ApiResponse(OK, "Identity verification successfull"));
});

export const resetPassword = asyncHandler(async (req, res, next) => {
  const { password, verificationAndResetToken } = req.body;
  if (
    [password, verificationAndResetToken].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    return next(new ApiError(BAD_REQUEST, "Please provide password and token"));
  }
  const user = await User.findOne({
    verificationAndResetToken: verificationAndResetToken,
    verificationAndResetTokenExpires: { $gt: Date.now() },
    resetTokenStatus: "verified",
  });
  if (!user) {
    return next(new ApiError(BAD_REQUEST, "Invalid token"));
  }
  user.password = password;
  user.verificationAndResetToken = undefined;
  user.verificationAndResetTokenExpires = undefined;
  user.resetTokenStatus = "unset";
  await user.save();
  res.status(OK).json(new ApiResponse(OK, "Reset done, login with new password"));
});
