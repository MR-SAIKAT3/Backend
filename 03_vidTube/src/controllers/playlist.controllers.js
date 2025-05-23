import mongoose, {isValidObjectId} from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.models.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, discription} = req.body

    const fields = {
        name: "Name",
        discription: "Discription"
    }

    for (const [key, label] of Object.entries(fields)) {
        const value = req.body[key]
        if (value === undefined || value === "") {
            throw new ApiError(400, `${label} is required`)
        }
    };

    const playlist = await Playlist.create({
        name,
        discription,
        owner: [req.user._id]
    });

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist created successfully"))

});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id")
    }

    const userPlaylist = await Playlist.find({owner: userId}).populate("video").populate("owner", "username email")

    if (!userPlaylist) {
        throw new ApiError(404, "User playlist not found")
    };

    return res.status(200).json(new ApiResponse(200, userPlaylist, "User playlist fetched successfully"))
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    };

    const playlist = await Playlist.findById(playlistId).populate("video").populate("owner", "username email");

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist fetch successfully"))
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    const fields = {
        playlistId: "Playlist Id",
        videoId: "Video Id"
    }

    for (const [key, label] of Object.entries(fields)) {
        const value = req.params[key];

        if (value === undefined || value === "") {
            throw new ApiError(400, `${label} is required`)
        }
        if (!isValidObjectId(value)) {
          throw new ApiError(400, `Invalid ${label} formate`);
        }
    };

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    };

    if (playlist.video.includes(videoId)) {
        throw new ApiError(409, "This video already exist on playlist")
    }
    playlist.video.push(videoId)
    await playlist.save()

    return res.status(200).json(new ApiResponse(200, playlist, "Video add to playlist successfully"))
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    const fields = {
      playlistId: "Playlist Id",
      videoId: "Video Id",
    };

    for (const [key, label] of Object.entries(fields)) {
      const value = req.params[key];

      if (value === undefined || value === "" ) {
        throw new ApiError(400, `${label} is required `);
      }
      if (!isValidObjectId(value)) {
        throw new ApiError(400, `Invalid ${label} formate`)
      }
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }

    if (!playlist.video.includes(videoId)) {
      throw new ApiError(404, "Video not found")
    }

    playlist.video.pull(videoId)
    await playlist.save();

    return res.status(200).json(new ApiResponse(200, {}, "Video remove successfully"))
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    await playlist.deleteOne()

    return res.status(200).json(new ApiResponse(200, {}, "Playlist delete successfully"))
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;
    const {name, discription} = req.body

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }

    if (!name || !discription) {
        throw new ApiError(400, "You must provide one field")
    };

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (name && playlist.name === name) {
        throw new ApiError(400, "Playlist name is already the same");
    }
    if (discription && playlist.discription === discription) {
        throw new ApiError(400, "Playlist description is already the same");
    }
    
    if (name) playlist.name = name;
    if (discription) playlist.name = name;

    await playlist.save()

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist update successfully"))
})


export{
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}