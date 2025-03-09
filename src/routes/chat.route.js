import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  addParticipant,
  createGroupChat,
  createOneToOneChat,
  getAllChats,
  getChatById,
  leaveGroup,
  removeParticipant,
  searchGroupChat,
  toggleAdmin,
  updateGroupIcon,
  updateGroupName,
} from "../controllers/chat.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();
router.use(authenticate);

router.route("/one-to-one").post(createOneToOneChat);
router.route("/group").post(createGroupChat);
router.route("/group/name").put(updateGroupName);
router
  .route("/group/participant")
  .put(addParticipant)
  .delete(removeParticipant);
router.route("/group/admin").put(toggleAdmin);
router.route("/group/leave").delete(leaveGroup);
router.route("/group/icon").put(upload.single("groupIcon"), updateGroupIcon);
router.route("/group/search").post(searchGroupChat);
router.route("/all").get(getAllChats);
router.route("/:chatId").get(getChatById);

export default router;
