import mongoose from 'mongoose';
import {Comment} from '../models/comment.model.js';
import {Post} from '../models/post.model.js';
import {User} from '../models/user.model.js';
import {Like} from '../models/like.model.js';
import{Tweet} from '../models/tweet.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';


const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    const{ page = 1, limit = 10} = req.query;
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, 'Invalid video ID');
    }
    page = Math.max(parseInt(page) || 1, 1);
    limit = Math.max(parseInt(limit) || 10, 1);
    const videoExists = await Video.exists({ _id: videoId });

    if (!videoExists) {
    throw new ApiError(404, "Video not found");
        }

    const comments= await Comment.aggregate([

        {
            $match: { video: mongoose.Types.ObjectId(videoId) }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'owner',
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
            $lookup:{
                from: 'likes',
                localField: '_id',
                foreignField: 'comment',
                as: 'likes'
            }
        },
        {
            $addFields: {
                likesCount: { $size: '$likes' },
                owner: {first: '$owner'},
                isLiked:{
                    $cond:{
                        if:{
                            $in: [req.user?._id?? null, '$likes.likedBy']
                        },
                        then: true,
                        else: false
                        }
                    }
                }
            },
        {
            $sort: { createdAt: -1 }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: limit
        },
        {
            $project: {
                likes: 0
            }
        }

    ])

    return res.status(200).json(new ApiResponse(200, comments, 'Comments retrieved successfully'));


})


const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!req.user?._id) {
        throw new ApiError(401, "User not authenticated");
    }
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id,
    });

    const createdComment = await Comment.findById(comment._id).populate(
        "owner",
        "fullName userName avatar"
    );

    return res
        .status(201)
        .json(new ApiResponse(201, createdComment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if(!req.user?._id || comment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to update this comment")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { $set: { content } },
        { new: true }
    );

    return res.status(200).json(new ApiResponse(200, updateComment, "Comment updated successfully"))


})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (!req.user?._id || comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment");
    }

    await Like.deleteMany({ comment: commentId });
    await Comment.findByIdAndDelete(commentId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment,
};

