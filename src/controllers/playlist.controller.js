import mongoose from "mongoose";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Playlist } from "../models/playlist.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (!name?.trim()) {
        throw new ApiError(400, "Playlist name is required");
    }

    const cleanName = name.trim();

    const existingPlaylist = await Playlist.findOne({
        owner: req.user._id,
        name: cleanName
    });

    if (existingPlaylist) {
        throw new ApiError(409, "Playlist with this name already exists");
    }

    const playlist = await Playlist.create({
        name: cleanName,
        description: description?.trim() || "",
        owner: req.user._id,
        videos: []
    });

    if (!playlist) {
        throw new ApiError(500, "Failed to create playlist");
    }

    return res
       .status(201)
       .json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { videoId, playlistId } = req.params;

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID");
    }

    const [playlist, video] = await Promise.all([
        Playlist.findById(playlistId),
        Video.findById(videoId)
    ]);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString()!== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist");
    }

    const alreadyExists = playlist.videos.some(
        (v) => v.toString() === videoId.toString()
    );

    if (alreadyExists) {
        throw new ApiError(400, "Video already exists in playlist");
    }

    playlist.videos.push(videoId);
    await playlist.save();

    return res
       .status(200)
       .json(new ApiResponse(200, playlist, "Video added to playlist successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId ||!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Valid User ID is required");
    }

    const playlists = await Playlist.aggregate([
        {
            $match: { owner: new mongoose.Types.ObjectId(userId) }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "coverVideoData",
                pipeline: [
                    { $match: { isPublished: true } },
                    { $limit: 1 },
                    { $project: { thumbnail: 1 } }
                ]
            }
        },
        {
            $addFields: {
                totalVideos: { $size: "$videos" },
                coverImage: { $first: "$coverVideoData" }
            }
        },
        {
            $project: {
                name: 1,
                description: { $ifNull: ["$description", "No description available"] },
                totalVideos: 1,
                coverImage: "$coverImage.thumbnail",
                updatedAt: 1
            }
        },
        {
            $sort: { updatedAt: -1 }
        }
    ]);

    return res
       .status(200)
       .json(new ApiResponse(200, playlists, "User playlists fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!playlistId ||!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Valid Playlist ID is required");
    }

    const playlist = await Playlist.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(playlistId) }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: { $first: "$owner" }
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" },
                totalVideos: { $size: "$videos" }
            }
        }
    ]);

    if (!playlist.length) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
       .status(200)
       .json(new ApiResponse(200, playlist[0], "Playlist fetched successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!playlistId ||!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Valid Playlist ID is required");
    }

    if (!name?.trim() &&!description?.trim()) {
        throw new ApiError(400, "Name or description is required");
    }

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString()!== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
               ...(name?.trim() && { name: name.trim() }),
               ...(description!== undefined && { description: description.trim() })
            }
        },
        { new: true }
    );

    return res
       .status(200)
       .json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { videoId, playlistId } = req.params;

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (!videoId ||!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Valid Video ID is required");
    }

    if (!playlistId ||!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Valid Playlist ID is required");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString()!== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist");
    }

    const videoExists = playlist.videos.some(
        (v) => v.toString() === videoId.toString()
    );

    if (!videoExists) {
        throw new ApiError(404, "Video not found in playlist");
    }

    playlist.videos = playlist.videos.filter(
        (v) => v.toString()!== videoId.toString()
    );

    await playlist.save();

    return res
       .status(200)
       .json(new ApiResponse(200, playlist, "Video removed from playlist successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (!playlistId ||!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Valid Playlist ID is required");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist does not exist");
    }

    if (playlist.owner.toString()!== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this playlist");
    }

    await Playlist.findByIdAndDelete(playlistId);

    return res
       .status(200)
       .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
};