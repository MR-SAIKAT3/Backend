import mongoose, {isValidObjectId} from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.models.js";

const getVideoComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid video id formate")
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const comments = await Comment.find({video: videoId})
    .populate("owner")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({createdAt : -1})

    if (!comments) {
        throw new ApiError(404, "No comments found")
    }

    const total = await Comment.countDocuments({video: videoId})

    return res
        .status(200)
        .json(new ApiResponse(200, {comments, total, pages: Math.ceil(total / limit)}, "Comment fetch successfully"))

});

const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {content} = req.body
    const userId = req.user._id

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    if (!content && content.trim() === "") {
        throw new ApiError(400, "Content is required")
    }

    const comment = await Comment.create({
        content,
        owner: userId,
        video: videoId
    });

    return res.status(200).json(new ApiResponse(200, comment, "Comment add successfully"))

})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const {content} = req.body
    const userId = req.user._id

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }

    if (!content && content.trim() === "") {
        throw new ApiError(400, "Content is required")
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to update this comment")
    };

    comment.content = content.trim()

    await comment.save()

    return res.status(200).json(new ApiResponse(200, comment, "Comment update successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    
    const {commentId} = req.params
    const userId = req.user._id

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment")
    };

    await comment.deleteOne()

    return res.status(200).json(new ApiResponse(200, null, "Comment delete successfully"))
})

export { getVideoComment, addComment, updateComment, deleteComment };