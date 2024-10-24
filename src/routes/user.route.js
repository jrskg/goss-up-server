import express from "express";
import {
  addProfilePicture,
  addPushToken,
  changePassword,
  forgetPassword,
  getSettings,
  getUserDetails,
  loadUser,
  loginUser,
  logoutUser,
  registerUser,
  requestVerificationEmail,
  resetPassword,
  searchUsers,
  updateBio,
  updateName,
  updateSettings,
  verifyEmail,
  verifyResetToken
} from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();  

router.route("/register").post(registerUser);
router.route("/request-verification").post(authenticate, requestVerificationEmail);
router.route("/verify/:token").get(verifyEmail);
router.route("/login").post(loginUser);
router.route("/me").get(authenticate, loadUser);
router.route("/logout").post(authenticate, logoutUser);

router.route("/profile").post(authenticate, upload.single("profilePic"), addProfilePicture);
router.route("/bio").put(authenticate, updateBio);
router.route("/push-token").post(authenticate, addPushToken);
router.route("/settings")
      .put(authenticate, updateSettings)
      .get(authenticate, getSettings);

router.route("/name").put(authenticate, updateName);
router.route("/change-password").put(authenticate, changePassword);
router.route("/forget-password").post(forgetPassword);
router.route("/verify-reset-token").post(verifyResetToken);
router.route("/reset-password").post(resetPassword);
router.route("/search").post(authenticate, searchUsers);
router.route("/:userId").get(authenticate, getUserDetails);

// router.route("/haha").get(test);
      

export default router;