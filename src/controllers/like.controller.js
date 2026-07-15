import ayncHandler from "../utils/asyncHandler";
import ApiResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";
import {Like} from "../models/like.model";
import {Video} from "../models/video.model.js";
import {User} from "../models/user.model.js";
import {Comment} from "../models/comment.model.js";
import {Tweet} from "../models/tweet.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    const userId = req.user.id;
     if (!req.user?._id) {
        throw new ApiError(401, "User not authenticated");
    }
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    const existingLike = await Like.findOne({ video: videoId, likedBy: userId });

    if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    return res.status(200).json(new ApiResponse(200, { liked: false }, "Video unliked successfully"));
}

    await Like.create({ video: videoId, likedBy: userId });
    return res.status(200).json(new ApiResponse(200, { liked: true }, "Video liked successfully"));
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!req.user?._id) {
        throw new ApiError(401, "User not authenticated");
    }
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id,
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res
            .status(200)
            .json(new ApiResponse(200, { liked: false }, "Comment unliked successfully"));
    }

    await Like.create({
        comment: commentId,
        likedBy: req.user._id,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { liked: true }, "Comment liked successfully"));
});


const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!req.user?._id) {
        throw new ApiError(401, "User not authenticated");
    }
    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id,
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res
            .status(200)
            .json(new ApiResponse(200, { liked: false }, "Tweet unliked successfully"));
    }

    await Like.create({
        tweet: tweetId,
        likedBy: req.user._id,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { liked: true }, "Tweet liked successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if(!req.user?._id) {
        throw new ApiError(401, "User not authenticated");
    }
    const likedVideos = await Like.aggregate([
        {$match:{
            likedBy: new mongoose.Types.ObjectId(userId),
            video: {$exists: true, $ne: null}
        }},
    {       $lookup:{
            from: "videos",
            localField: "video",
            foreignField: "_id",
            as: "video",
            pipeline: [
                {$match:{
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {$project: { username: 1, avatar: 1, fullName:1 }}
                    ]
                }
            },
            {$addFields: {owner:{
                $first: "$owner"
            }
         }
                }
            ]
        }
    },
    
        {
            $addFields: {
                video:{
                    $first: "$video"
                }
            }
        },
        {
            $project:{
                video: 1,
                _id: 0
            }
        }
    

    ])



    return res.status(200).json(new ApiResponse(200, likedVideos.map((v) => v.video), "Liked videos fetched successfully"))
})

export {toggleVideoLike, 
        toggleCommentLike, 
        toggleTweetLike, 
        getLikedVideos
        };