import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.models.js";
import { deleteFromCloudinay, uploadOnCloudinay } from "../utils/cloudinary.js";
import { deleteLocalFile } from "../utils/deleteLocalFIle.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const {page = 1, limit = 10, query, sortBy, sortType, userId} = req.query;

    const filters = {};

    if (query) {
      filters.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    if (userId && isValidObjectId(userId)) {
      filters.owner = userId;
    }

    const sortOptions = {};

    sortOptions[sortBy] = sortType === "asc" ? 1 : -1;

    // pagination config

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const total = await Video.countDocuments(filters);
    const videos = await Video.find(filters)
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(parseInt(limit));
    

    const responsData = {
      videos,
      pagination:{
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    }                        
    return res
      .status(200)
      .json(new ApiResponse(200, responsData, "Videos fetched successfully"));

})

const publishVideo = asyncHandler(async (req, res) => {
  
  let videoFile = null;
  let thumbnail = null;
  const videoLocalPath = req.file?.path;
  const thumbnailLocalPath = req.file?.path

  try {
    const { title, description } = req.body;

    const fields = { title: "Title", description: "Description" };

    for (const [key, label] of Object.entries(fields)) {
      const value = req.body[key];
      if (!value) {
        throw new ApiError(400, `${label} is required`);
      }
    }

    const existedVideo = await Video.findOne({
      $or: [{ title }, { description }],
    });

    if (existedVideo) {
      throw new ApiError(409, "Video with title or description already exists");
    }

    if (!videoLocalPath) {
      throw new ApiError(400, "Video file is missing");
    }

    videoFile = await uploadOnCloudinay(videoLocalPath);

    //Thumbnail
    
    if (!thumbnailLocalPath) {
      throw new ApiError(400, "Thumbnail file is missing")
    }

    thumbnail = await uploadOnCloudinay(thumbnailLocalPath)
    

    const video = await Video.create({
      title,
      description,
      videoFile: videoFile?.url,
      duration: videoFile.duration,
      thumbnail: thumbnail?.url,
      owner: [req.user?._id]
    });

    return res
      .status(200)
      .json(new ApiResponse(200, video, "Video uploaded successfully"));
  } catch (error) {
    console.error("Video publish failed:", error);

    // Clean local file
    if (videoLocalPath) {
      deleteLocalFile(videoLocalPath);
    }

    // Delete from cloudinary if already uploaded
    if (videoFile?.public_id) {
      await deleteFromCloudinay(videoFile.public_id);
    }

    // Rethrow to asyncHandler
    throw error;
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, `Video id is required`);
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId format");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Sorry video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetch successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "videoId is required");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id format");
  }
  const { title, description } = req.body;
  if (!title && !description) {
    throw new ApiError(
      400,
      "At least one of 'title' or 'description' must be provided"
    );
  }
  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
      },
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, video, "video update successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {

    const {videoId} = req.params;

    if (!videoId) {
        throw new ApiError(400, "VideoId is required")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id format");
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.videoFile) {
        const publicId = video.videoFile.split("/").pop().split(".")[0];
        await deleteFromCloudinay(publicId)
    }

    await video.deleteOne()

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video delete successfully"))
});

const togglePublishStatus = asyncHandler(async (req, res) => {

    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, "VideoId is required")
    };

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id format");
    };

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found")
    };

    video.isPublish = !video.isPublish;

    await video.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, video, `video has been ${video.isPublish ? "publish" : "unpublish"} successfully`))
})

export { 
    getAllVideos, 
    publishVideo, 
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
