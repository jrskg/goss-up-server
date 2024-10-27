import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  KAFKA_NOTIFICATION_TOPIC,
  NOT_FOUND,
  OK,
} from "../utils/constants.js";
import { Friendship } from "../models/friendship.model.js";
import { Notification } from "../models/notification.model.js";
import { produceNotification } from "../configs/kafka.js";
import mongoose from "mongoose";

export const createFriendRequest = asyncHandler(async (req, res, next) => {
  const { receiverId } = req.body;
  if (!receiverId || receiverId.trim() === "") {
    return next(new ApiError(BAD_REQUEST, "Please provide user id"));
  }
  if (receiverId.toString() === req.user._id?.toString()) {
    return next(
      new ApiError(BAD_REQUEST, "Haha!! you can't send request to yourself")
    );
  }
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return next(new ApiError(BAD_REQUEST, "User not found"));
  }
  if (!receiver.verified) {
    return next(new ApiError(BAD_REQUEST, "User not verified"));
  }
  let userOneId = new mongoose.Types.ObjectId(req.user._id);
  let userTwoId = new mongoose.Types.ObjectId(receiverId);
  if (userOneId > userTwoId) {
    [userOneId, userTwoId] = [userTwoId, userOneId];
  }
  const isFriendshipExists = await Friendship.findOne({ userOneId, userTwoId });
  if (isFriendshipExists) {
    return next(
      new ApiError(
        BAD_REQUEST,
        "Friendship already exists, please refresh the page"
      )
    );
  }
  const friendship = await Friendship.create({
    userOneId: req.user._id,
    userTwoId: receiver._id,
    requestSenderId: req.user._id,
    receiverId: receiver._id,
  });
  if (!friendship) {
    return next(new ApiError(INTERNAL_SERVER_ERROR, "Something went wrong"));
  }
  const notification = await Notification.create({
    userId: receiverId,
    type: "friend_request",
    data: {
      fromUserId: req.user._id,
      message: `${req.user.name} sent you a friend request`,
    },
  });

  if (!notification) {
    return next(new ApiError(INTERNAL_SERVER_ERROR, "Something went wrong"));
  }
  const isNotificationEnabled = receiver.settings.notificationEnabled;
  await produceNotification(KAFKA_NOTIFICATION_TOPIC, {
    tokens: receiver.pushTokens,
    options: isNotificationEnabled
      ? {
          title: "Friend Request",
          body: `${req.user.name} sent you a friend request`,
        }
      : undefined,
    data: {
      type: "friend_request",
      friendshipId: friendship._id,
    },
  });
  res.status(OK).json(
    new ApiResponse(OK, "Friend request created", {
      friendshipId: friendship._id,
    })
  );
});

export const respondFriendRequest = asyncHandler(async (req, res, next) => {
  const { friendshipId, status } = req.body;
  if (!friendshipId) {
    return next(new ApiError(BAD_REQUEST, "Please provide friendship id"));
  }
  if (!["accepted", "rejected"].includes(status)) {
    return next(new ApiError(BAD_REQUEST, "Invalid status"));
  }
  let friendship = await Friendship.findById(friendshipId).populate(
    "requestSenderId"
  );
  if (!friendship) {
    return next(new ApiError(NOT_FOUND, "Friendship not found"));
  }
  if (friendship.status === "accepted") {
    return res.status(OK).json(
      new ApiResponse(OK, "Friend request already accepted", {
        alreadyFriends: true,
      })
    );
  }
  if (status === "rejected") {
    await Friendship.findByIdAndDelete(friendshipId);
    return res.status(OK).json(new ApiResponse(OK, "Friend request rejected"));
  }
  const reqSender = friendship.requestSenderId;
  friendship.status = status;
  await friendship.save();

  const notification = await Notification.create({
    userId: reqSender._id,
    type: "friend_request",
    data: {
      fromUserId: req.user._id,
      message: `${req.user.name} accepted your friend request`,
    },
  });

  if (!notification) {
    return next(new ApiError(INTERNAL_SERVER_ERROR, "Something went wrong"));
  }
  const isNotificationEnabled = reqSender.settings.notificationEnabled;
  await produceNotification(KAFKA_NOTIFICATION_TOPIC, {
    tokens: reqSender.pushTokens,
    options: isNotificationEnabled
      ? {
          title: "Friend Request",
          body: `${req.user.name} accepted your friend request`,
        }
      : undefined,
    data: {
      type: "friend_request_accepted",
      friendshipId: friendship._id,
    },
  });

  res.status(OK).json(new ApiResponse(OK, "Friend request responded"));
});

export const cancelFriendRequest = asyncHandler(async (req, res, next) => {
  const { friendshipId } = req.params;
  if (!friendshipId || friendshipId.trim() === "") {
    return next(new ApiError(BAD_REQUEST, "Please provide friendship id"));
  }
  const friendship = await Friendship.findById(friendshipId);
  if (!friendship) {
    return next(new ApiError(NOT_FOUND, "Friendship not found"));
  }
  if (friendship.status === "accepted") {
    return res.status(OK).json(
      new ApiResponse(OK, "Friend request already accepted", {
        alreadyFriends: true,
      })
    );
  }
  if (friendship.requestSenderId.toString() !== req.user._id.toString()) {
    return next(
      new ApiError(BAD_REQUEST, "You can only cancel your own friend request")
    );
  }
  await Friendship.findByIdAndDelete(friendshipId);
  res.status(OK).json(new ApiResponse(OK, "Friend request canceled"));
});

export const getFriendRequests = asyncHandler(async (req, res, next) => {
  const limit = 50;
  let page = Number(req.query?.page);
  if (isNaN(page) || page < 1) page = 1;
  const userId = req.user?._id?.toString();
  const friendRequestsResults = await Friendship.aggregate([
    {
      $match: {
        $and: [
          {
            receiverId: new mongoose.Types.ObjectId(userId),
          },
          {
            status: "pending",
          },
        ],
      },
    },
    {
      $facet: {
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $lookup: {
              from: "users",
              localField: "requestSenderId",
              foreignField: "_id",
              as: "sender",
              pipeline: [
                {
                  $project: {
                    name: 1,
                    profilePic: 1,
                  },
                },
              ],
            },
          },
          { $unwind: "$sender" },
          {
            $project: {
              status: 1,
              sender: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
        total: [{ $count: "count" }],
      },
    },
  ]);
  const friendRequests = friendRequestsResults[0].data;
  const totalRequests = friendRequestsResults[0].total[0]
    ? friendRequestsResults[0].total[0].count
    : 0;
  const hasMore = page * limit < totalRequests;
  res.status(OK).json(
    new ApiResponse(OK, "Get friend request success", {
      friendRequests,
      totalRequests,
      hasMore,
    })
  );
});

export const getAllFriends = asyncHandler(async (req, res, next) => {
  const limit = 5;
  let page = Number(req.query?.page);
  if (isNaN(page) || page < 1) page = 1;
  const userId = req.user?._id?.toString();
  const responseData = await Friendship.aggregate([
    {
      $match: {
        $and: [
          {
            $or: [
              { userOneId: new mongoose.Types.ObjectId(userId) },
              { userTwoId: new mongoose.Types.ObjectId(userId) },
            ],
          },
          { status: "accepted" },
        ],
      },
    },
    {
      $facet: {
        data: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $addFields: {
              friendId: {
                $cond: {
                  if: {
                    $eq: ["$userOneId", new mongoose.Types.ObjectId(userId)],
                  },
                  then: "$userTwoId",
                  else: "$userOneId",
                },
              },
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "friendId",
              foreignField: "_id",
              as: "friend",
              pipeline: [
                {
                  $project: {
                    name: 1,
                    profilePic: 1,
                  },
                },
              ],
            },
          },
          {
            $unwind: "$friend",
          },
          {
            $project: {
              status: 1,
              friend: 1,
              updatedAt: 1,
            },
          },
        ],
        total: [{ $count: "count" }],
      },
    },
  ]);
  const friends = responseData[0].data;
  const total = responseData[0].total[0] ? responseData[0].total[0].count : 0;
  const hasMore = page * limit < total;
  res.status(OK).json(
    new ApiResponse(OK, "Get all friends success", {
      friends,
      total,
      hasMore,
    })
  );
});

export const searchInFriends = asyncHandler(async (req, res, next) => {
  const limit = 5;
  let page = Number(req.query?.page);
  const query = req.query?.search?.trim() || "";
  if (!query) {
    return next(new ApiError(BAD_REQUEST, "Please provide search query"));
  }
  if (isNaN(page) || page < 1) page = 1;
  const userId = req.user?._id?.toString();
  const responseData = await Friendship.aggregate([
    {
      $match: {
        $and: [
          {
            $or: [
              { userOneId: new mongoose.Types.ObjectId(userId) },
              { userTwoId: new mongoose.Types.ObjectId(userId) },
            ],
          },
          { status: "accepted" },
        ],
      },
    },
    {
      $addFields: {
        friendId: {
          $cond: {
            if: {
              $eq: ["$userOneId", new mongoose.Types.ObjectId(userId)],
            },
            then: "$userTwoId",
            else: "$userOneId",
          },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "friendId",
        foreignField: "_id",
        as: "friend",
        pipeline: [
          {
            $project: {
              name: 1,
              profilePic: 1,
            },
          },
        ],
      },
    },
    {$unwind: "$friend"},
    {$match:{"friend.name": {$regex: query, $options: "i"}}},
    {
      $facet: {
        data: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              status: 1,
              friend: 1,
              updatedAt: 1,
            },
          },
        ],
        total: [{ $count: "count" }],
      },
    },
  ]);
  const friends = responseData[0].data;
  const total = responseData[0].total[0] ? responseData[0].total[0].count : 0;
  const hasMore = page * limit < total;
  res.status(OK).json(
    new ApiResponse(OK, "Search in friends success", {
      friends,
      total,
      hasMore,
    })
  );
});

export const getAllFriendReqSent = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id?.toString();
  const sentRequests = await Friendship.aggregate([
    {
      $match: {
        $and: [
          { status: "pending" },
          { requestSenderId: new mongoose.Types.ObjectId(userId) },
        ],
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $addFields: {
        receiverId: {
          $cond: {
            if: {
              $eq: ["$userOneId", new mongoose.Types.ObjectId(userId)],
            },
            then: "$userTwoId",
            else: "$userOneId",
          },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "receiverId",
        foreignField: "_id",
        as: "receiver",
        pipeline: [
          {
            $project: {
              name: 1,
              profilePic: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$receiver",
    },
    {
      $project: {
        status: 1,
        receiver: 1,
        createdAt: 1,
      },
    },
  ]);
  res
    .status(OK)
    .json(new ApiResponse(OK, "Get all friends success", sentRequests));
});
