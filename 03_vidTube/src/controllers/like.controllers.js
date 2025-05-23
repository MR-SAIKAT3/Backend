import mongoose, {isValidObjectId} from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {Like} from "../models/like.models.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const userId = req.user._id

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id formate")
    }
    
    const existing = await Like.findOne({likeBy: userId, video: videoId})

    if (existing) {
        await existing.deleteOne()
        return res.status(200).json(new ApiResponse(200, {like: false}, "video unliked" ))
    }

    const like = await Like.create({
        likeBy: userId,
        video: videoId
    });

    return res.status(200).json(new ApiResponse(200, {like: true, like}, "video liked"))

});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const userId = req.user._id

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }

    const existing = await Like.findOne({
        likeBy: userId,
        comment: commentId
    })

    if (existing) {
        await existing.deleteOne()
        return res.status(200).json(new ApiResponse(200, {like: false}, "Unliked comment"))
    }

    const like = await Like.create({
        likeBy: userId,
        comment: commentId
    });

    return res.status(200).json(new ApiResponse(200, {like: true, like}, "Liked comment"))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const userId = req.user._id

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid comment id")
    }

    const existing = await Like.findOne({
        likeBy: userId,
        tweet: tweetId
    })

    if (existing) {
        await existing.deleteOne()
        return res.status(200).json(new ApiResponse(200, {like: false}, "Unliked tweet"))
    }

    const like = await Like.create({
        likeBy: userId,
        tweet: tweetId
    });

    return res.status(200).json(new ApiResponse(200, {like: true, like}, "Liked tweet"))
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const {page = 1, limit = 10} = req.query

    const skip = (parseInt(page) -1) * parseInt(limit);

    const likes = await Like
            .find({likeBy: userId, video: {$exists: true}})
            .populate("video")
            .limit(parseInt(limit))
            .skip(skip)
    const likedVideos = likes.map(like => like.video)

    return res.status(200).json(new ApiResponse(200, likedVideos, "Fetch liked videos"))

})

export{
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}