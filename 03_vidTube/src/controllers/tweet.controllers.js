import mongoose, {isValidObjectId} from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweet.models.js";

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    const userId = req.user?._id

    if (!content) {
        throw new ApiError(400, "Tweet content is required")
    };

    const tweet = await Tweet.create({
        content,
        owner: [userId]
    });

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet create successfully"))
});

const getUserTweets= asyncHandler(async (req, res) => {
    const userId = req.user?._id

    const tweets = await Tweet.find({ owner: userId }).sort({ createdAt : -1});

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "Tweets fetch successfully"))
});

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    const {content} = req.body
    const userId = req.user?._id

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }

    if (!content) {
        throw new ApiError(400, "Tweet content is required")
    };

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    // Check if current user is the owner

    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authrozied to update this tweet")
    };

    tweet.content = content || tweet.content

    await tweet.save()

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet update successfully"))

});

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    const userId = req.user?._id

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }

    const tweet = await Tweet.findById(tweetId)

    // check if the current user is the owner of the tweet

    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to delete this tweet")
    }

    await tweet.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Tweet delete successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}