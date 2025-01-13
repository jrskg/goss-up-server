import { isValidObjectId, Types } from "mongoose";
import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  BAD_REQUEST,
  NOT_FOUND,
  OK,
  UNAUTHORIZED
} from "../utils/constants.js";

export const getAllMessagesOfChat = asyncHandler(async (req, res, next) => {
  let { chatId, page } = req.query;
  page = isNaN(page) ? 1 : Number(page);
  if (page < 1) page = 1;
  const limit = 100;

  if (!chatId || !isValidObjectId(chatId)) {
    return next(new ApiError(BAD_REQUEST, "Invalid chat id"));
  }

  const chat = await Chat.findById(chatId, { participants: 1 }).lean();
  if (!chat) {
    return next(new ApiError(NOT_FOUND, "Chat not found"));
  }
  if (!chat.participants.includes(req.user._id.toString())) {
    return next(
      new ApiError(UNAUTHORIZED, "You are not a participant of this chat")
    );
  }
  const messages = await Message.aggregate([
    { $match: { chatId: Types.ObjectId.createFromHexString(chatId) } },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        total: [{ $count: "count" }],
      },
    },
  ]);

  const messagesData = messages[0].data;
  const totalMessages = messages[0].total[0] ? messages[0].total[0].count : 0;
  const hasMore = page * limit < totalMessages;

  res.status(OK).json(
    new ApiResponse(OK, "Get all messages of chat success", {
      messages: messagesData,
      totalMessages,
      hasMore,
    })
  );
});

export const uploadAttachments = asyncHandler(async (req, res, next) => {
  // {
  //   fieldname: 'files',
  //   originalname: 'Anish sir (1).pdf',
  //   encoding: '7bit',
  //   mimetype: 'application/pdf',
  //   destination: './public/attachments',
  //   filename: 'Anish sir (1)1736507058784.pdf',
  //   path: 'public/attachments/Anish sir (1)1736507058784.pdf',
  //   size: 1257189
  // },
  
  // interface IAttachment{
  //   fileUrl: string;
  //   fileType: FileType;
  //   originalFileName: string;
  //   size: number;
  // }
  console.log(req.files);
  res.status(OK).json(new ApiResponse(OK, "Attachments uploaded"));
})