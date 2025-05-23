import mongoose, {isValidObjectId} from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {Subcription} from "../models/subcription.models.js";
import { User } from "../models/user.models.js";

const toggleSubscription = asyncHandler(async (req, res) => {

  const { channelId } = req.params
  const userId = req.user?._id


  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Channel id is required")
  }

  if (userId === channelId) {
    throw new ApiError(400, "You cannot subscribe to your own channel")
  }

  const channel = await User.findById(channelId)

  if (!channel) {
    throw new ApiError(404, "Channel not found")
  }

  const existing = await Subcription.findOne({
    subscriber: userId,
    channel: channelId
  })

  if (existing) {
    await existing.delete()
    return res
      .status(200)
      .json(
        new ApiResponse(200, { subscribed: false }, "Unsubscribed successfully")
      );
  }

  await Subcription.create({
    subscriber: userId,
    channel: channelId
  });

  return res
    .status(200)
    .json(200, { subscribed: true}, "Subscribed successfully");

});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {

    const {channelId} = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Channel is required")
    };

    const subscribers = await Subcription.aggregate([
      {
        $match: {
          channel:  mongoose.Types.ObjectId(channelId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "subscriber",
          foreignField: "_id",
          as: "subscribers"
        },
      },
      {
        $unwind: "$subscribers"
      },
      {
        $project:{
          _id : 0,
          subscriberId: "$subscribers._id",
          username: "$subscribers.username",
          email: "$subscribers.email"
        }
      }
    ]);


    if (!subscribers.length) {
      throw new ApiError(404, "Not found any subscribers")
    }

    return res
      .status(200)
      .json( new ApiResponse(200, {total: subscribers.length, subscribers}, "User channel subscribers fetch successfully") )
});

const getSubscribedChannels = asyncHandler(async (req, res) => {

  const {subscriberId} = req.params
  
  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Subscriber id is required")
  }

  const channels = await Subcription.aggregate([
    {
      $match: {
        subscriber: mongoose.Types.ObjectId(subscriberId)
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channels"
      }
    },
    {
      $unwind: "$channels"
    },
    {
      $project: {
        _id: 0,
        channelId: "$channels._id",
        username: "$channels.username",
        email: "$channels.email"
      }
    }
  ]);

  if (!channels.length) {
    throw new ApiError(404, "Not found any channel where subscribed")
  }

  return res
    .status(200)
    .json( new ApiResponse(200, channels, "User subscribed channels fetch successfully"))

})

export {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels
}