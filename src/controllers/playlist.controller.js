import mongoose from "mongoose";
import ApiRespone from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";
import asyncHandler from "../utils/asyncHandler"
import {Video}  from "../models/video.model";
import {Playlist} from "../models/playlist.model";

const createPlaylist = asyncHandler(async (req,res)=>{
    
    const {name,description} = req.query;

    if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized request");
  }
     if (!name?.trim()) {
    throw new ApiError(400, "Playlist name is required");
  }

  

  const playlist = await Playlist.create({
    name: name.trim(),
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

const addVideoToPlaylist = asyncHandler(async()=>{
    const {videoId,playlistId} = req.pramas;

     if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized request");
  }
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Video Id is not Valid")
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400, "Playlist Id is not Valid")
    }

      const [playlist, video] = await Promise.all([
    Playlist.findById(playlistId),  
    Video.findById(videoId),
  ]);

  if(!video){
    throw new ApiError(404, "Video not Found")
  }
  if(!playlist){
    throw new ApiError(404, "Playlist not Found")
  }

   if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to modify this playlist");
  }

  const alreadyExists = playlist.videos.some(
    (v)=> v.toString === videoId.toString
  )

  if(alreadyExists){
    throw new ApiError (400, "Video already Exists in Playlist")
  }

   playlist.videos.push(videoId);
  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video added to playlist successfully"));

  


})

    





})