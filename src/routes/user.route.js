import express from "express";
import { 
  addProfilePicture, 
  addPushToken, 
  changePassword, 
  forgetPassword, 
  getSettings, 
  loadUser, 
  loginUser, 
  logoutUser, 
  registerUser, 
  requestVerificationEmail, 
  resetPassword, 
  updateBio, 
  updateName, 
  updateSettings, 
  verifyEmail 
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";

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
router.route("/reset-password").post(resetPassword);
      

export default router;