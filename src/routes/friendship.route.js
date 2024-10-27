import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { 
  cancelFriendRequest, 
  createFriendRequest, 
  getAllFriendReqSent, 
  getAllFriends, 
  getFriendRequests, 
  respondFriendRequest, 
  searchInFriends
} from "../controllers/friendship.controller.js";

const router = express.Router();  

router.route("/create").post(authenticate, createFriendRequest);
router.route("/request/all").get(authenticate, getFriendRequests);
router.route("/request/respond").post(authenticate, respondFriendRequest);
router.route("/request/cancel/:friendshipId").delete(authenticate, cancelFriendRequest);
router.route("/friends").get(authenticate, getAllFriends);
router.route("/friends/search").get(authenticate, searchInFriends);
router.route("/request/sent").get(authenticate, getAllFriendReqSent);
export default router;