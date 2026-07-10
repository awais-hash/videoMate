import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import Video from "../models/video.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import {deleteFromCloudinary, uploadToCloudinary} from "../utils/cloudinaryUpload.js";


const publishVideo = asyncHandler(async (req, res) => {

if (!req.user) {
    throw new ApiError(401, "User not authenticated");
}
const {title, description} = req.body;
if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
}

const videoFileLocalPath = req.file?.videoFile?.[0]?.path; 
const thumbnailLocalPath = req.file?.thumbnail?.[0]?.path;   
if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is required");
}


// if (!isValidFileType(videoFileLocalPath)) {
//     throw new ApiError(400, "Invalid video file type");
// }

if (!thumbnailLocalPath) {
    throw new ApiError(400, " thumbnail file is required");
}
// if (!isValidFileType(thumbnailLocalPath)) {
//     throw new ApiError(400, "Invalid thumbnail file type");
// }

      
const videoFile = await uploadToCloudinary(videoFileLocalPath);
const thumbnail = await uploadToCloudinary(thumbnailLocalPath);


if (!videoFile?.url || !thumbnail?.url ) {
    throw new ApiError(500, "Failed to upload video or thumbnail");
}
if (!videoFile?.public_id || !thumbnail?.public_id) {
    throw new ApiError(500, "Failed to get public ID for video or thumbnail");
}

    const createdVideo = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    videoFilePublicId: videoFile.public_id,
    thumbnailPublicId: thumbnail.public_id,
    owner: req.user._id,
    title,
    description,
    isPublished: true,
    duration: videoFile.duration || 0

})
if (!createdVideo) {
    throw new ApiError(500, "Failed to create/Publish video");
}

    return res.status(200).json(new ApiResponse(200, createdVideo, "Video published successfully"));

}
)

//Get a video by ID

const getVideoById = asyncHandler(async (req, res) => {

    const {videoId} = req.params;

    const video = await Video.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(videoId)
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {$project: {avatar: 1, userName: 1, fullName:1}}
          ]
        }
      },
      {
        $lookup:{
            from: "likes",
            localField: "_id",
            foreignField: "video",
            as: "likes"
        }
      },
      {
        $lookup:{
            from: "comments",
            localField: "_id",
            foreignField: "video",
            as: "comments"  

      }
    },
    {
         $addFields: {
            owner: { $first: "$owner" }, 
            likesCount: { $size: "$likes" },
            commentsCount: { $size: "$comments" }, 
            isLiked: {
                $cond: {
                    if: { $in: [req.user?._id, "$likes.likedBy"] },
                    then: true,
                    else: false
                }
            }
        }
    },
    {
        $project:{
            likes: 0,
            comments: 0
        }
    }



    ])

    if (!video?.length) {
        throw new ApiError(404, "Video not found");
    }

    await Video.findByIdAndUpdate(videoId,
         {
            $inc: {views: 1}
        }, 
         {new: true}
        );
    await User.findByIdAndUpdate(req.user?._id,
         {
            $addToSet: {watchHistory: videoId}
         },
         {new: true}
        );

        return res.status(200).json(new ApiResponse(200, video[0], "Video fetched successfully"));


})

// get all videos 

const getAllVideos = asyncHandler(async (req, res) => {



    const {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        order = "desc",
        userId,
        query
    } = req.query;

    const pipeline= [];

    if (query){
        pipeline.push({
            $match: {
                $or:[
                    {title: {$regex: query, $options: "i"}},
                    {description: {$regex: query, $options: "i"}}
                ]
            }
        })
    }
    if (userId){
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        })
    }

    pipeline.push({
        $match:{
            isPublished: true
        }
    })


    const sort = {};
    sort[sortBy] = order === "asc" ? 1 : -1;
    pipeline.push({
        $sort: sort
    })
   
    pipeline.push({
        $skip: (parseInt(page) - 1) * parseInt(limit)
   
    })

    pipeline.push({
        $limit: parseInt(limit)
    })
    

    pipeline.push({
        $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
            {$project: 
                {avatar: 1, userName: 1, fullName:1}
            }
        ]
    }
    })

    pipeline.push({
        $addFields: {
            owner: { $first: "$owner" }
        }
    })

    const videos = await Video.aggregate(pipeline);
    return res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"));
})

//update video details

const updateVideoDetails = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    const localThumbnailPath = req.file?.path;

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (!req.user?._id || video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not the owner of this video");
    }

    if (title === undefined && description === undefined && !localThumbnailPath) {
        throw new ApiError(400, "At least one field must be provided for update");
    }

    let newThumbnailUrl = video.thumbnail;
    let newThumbnailPublicId = video.thumbnailPublicId; 
    const oldThumbnailPublicId = video.thumbnailPublicId;

    if (localThumbnailPath) {
        const uploadedThumbnail = await uploadToCloudinary(localThumbnailPath);
        if (!uploadedThumbnail?.url) {
            throw new ApiError(500, "Failed to upload new thumbnail");
        }
        newThumbnailUrl = uploadedThumbnail.url;
        newThumbnailPublicId = uploadedThumbnail.public_id;
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,{
       $set: {
            title: title !== undefined ? title : video.title,
            description: description !== undefined ? description : video.description,
            thumbnail: newThumbnailUrl,
            thumbnailPublicId: newThumbnailPublicId,
        }},
        { new: true }
    );

    
    if (localThumbnailPath && oldThumbnailPublicId) {
        try {
            await deleteFromCloudinary(oldThumbnailPublicId);
        } catch (err) {
            console.error("Failed to delete old thumbnail from Cloudinary:", err);
        }
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video details updated successfully"));
});