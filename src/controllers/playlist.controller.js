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

const getUserPlaylists = asyncHandler(async ()=>{
  const {userId} = req.params;
  if(!userId ||!mongoose.Types.ObjectId.isValid(userId)){
    throw new ApiError(404,"Valid user Id is requied")
  }
  const playlists = await Playlist.aggregate([
    {
      $match : { owner: mongoose.Types.ObjectId(userId)
    }
  },

  {
    $lookup:{
      from: "videos",
      localField : "videos",
      foreignField:"_id",
      as: "coverVideoData",
      pipeline:[
        {
          $match:{
            $isPublished: true
          }
        },
        {
          $limit: 1
        },
        {
          $project:{
            thumbnail :1
          }
        }
      ]
    }
  },
  {
    $addFields:{
      totalVideos:{
        $size: "$videos"

      },
      coverImage:{
        $first: "$cover"
      }

    }
    
  },
  {
    $project:{
      name:1,
      description:{ $ifNull: ["$description", "No description available"] }, 
      totalVideos: 1,
      coverImage: "$coverImage.thumbnail",
      updatedAt:1,

    }
  },

  {
    $sort:{
      updatedAt: -1
    }
  }


  ])
return res
    .status(200)
    .json(new ApiResponse(200, playlists, "User playlists fetched successfully")); 
})

const getPlaylistById = asyncHandler(async(req,res)=>{

  const {playlistId} = req.pramas;
  if (!playlistId || !!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Valid Playlist ID is required");
  }

  const playlist = await Playlist.aggregate([
    {
      $match:mongoose.Types.ObjectId(playlistId)
    },
    {
      $lookup:{
        from : "videos",
        localField:"videos",
        foreignField:"_id",
        as:"videos",
        pipeline:[
          {
            $lookup:{
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    userName:1,
                    fullName:1,
                    avatar:1,
                  }
                }
              ]

            }
          },
          {
            $addFields:{
              $first: "$owner"
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
              avatar: 1,
            },
          },
        ],
      },
    },
   {
      $addFields: {
        owner: { $first: "$owner" },
        totalVideos: { $size: "$videos" },
      },
    }

  ])

   if (!playlist.length) {
    throw new ApiError(404, "Playlist not found");
  }

  return res.status(200).json(
    new ApiRespone(200, playlist[0], "Playlist fetched successfully")
  )


  
})

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Valid Playlist ID is required");
  }
  if (!name?.trim() && !description?.trim()) {
    throw new ApiError(400, "Name or description is required");
  }
  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized request");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this playlist");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        ...(name?.trim() && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"));
});

const removeVideoFromPlaylist= asyncHandler(async(req,res)=>{
  const {videoId, playlistId}= req.params;
  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized request");
  }

  if(!videoId || mongoose.Types.ObjectId.isValid(videoId)){
    throw new ApiError(404, "Valid videoId is required");
  }
  if(!playlistId || mongoose.Types.ObjectId.isValid(playlistId)){
    throw new ApiError(404, "Valid playlistId is required");
  }
    const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to modify this playlist");
  }

  const videoExists = playlist.videos.some(
    (v) => v.toString() === videoId.toString()
  );

  if (!videoExists) {
    throw new ApiError(404, "Video not found in playlist");
  }
  playlist.videos = playlist.videos.filter(
    (v) => v.toString() !== videoId.toString()
  );
  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video removed from playlist successfully"));

})

const deletePlaylist = asyncHandler(async (res,req)=>{
  const {playlistId} = req.params;
  if (!req.user?._id){
    throw new ApiError (404, "Unathorized request");
  }
  if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)){
    throw new ApiError(400, "A valid ID of playlist is required")
  }
   if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this playlist");
  }

  const playlist = await Playlist.findById(playlistId)
  if(!playlist){
    throw new ApiError (405, "Playlist doesn't exist")
  }
  await Playlist.findByIdAndDelete(playlistId);

  return res.status(200).json(new ApiRespone(200, {}, "Playlist successfully deleted"));
})


export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};