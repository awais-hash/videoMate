import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { Playlist } from "../models/playlist.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Tweet } from "../models/tweet.model.js";
import mongoose from "mongoose";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinaryUpload.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Failed to generate access and refresh tokens");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { userName, email, password, fullName } = req.body;

    if (!password?.trim() || !fullName?.trim()) {
        throw new ApiError(400, "Full name and password are required");
    }

    if (!userName?.trim() && !email?.trim()) {
        throw new ApiError(400, "Either username or email is required");
    }

    const orConditions = [];
    if (userName?.trim()) orConditions.push({ userName });
    if (email?.trim()) orConditions.push({ email });

    const existingUser = await User.findOne({ $or: orConditions });
    if (existingUser) {
        throw new ApiError(409, "User with the same username or email already exists");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
    }

    const avatar = await uploadToCloudinary(avatarLocalPath);
    const coverImage = await uploadToCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar image is required");
    }

    const user = await User.create({
        userName,
        fullName,
        email,
        password,
        avatar: {
            public_id: avatar.public_id,
            url: avatar.secure_url
        },
        coverImage: {
            public_id: coverImage ? coverImage.public_id : "",
            url: coverImage ? coverImage.secure_url : ""
        }
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "User creation failed");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser },
                "User registered and logged in successfully"
            )
        );
});

const loginUser = asyncHandler(async (req, res, next) => {
    const { email, userName, password } = req.body;

    if (!password?.trim()) {
        throw new ApiError(400, "Password is required");
    }

    if (!email?.trim() && !userName?.trim()) {
        throw new ApiError(400, "Either email or username is required");
    }

    const orConditions = [];
    if (email?.trim()) orConditions.push({ email });
    if (userName?.trim()) orConditions.push({ userName });

    const user = await User.findOne({ $or: orConditions });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const comparePassword = await user.isPasswordCorrect(password);
    if (!comparePassword) {
        throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "User logged in successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null }, { new: true });

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                null,
                "User logged out successfully"
            )
        );
});

const refreshAccessToken = asyncHandler(async (req, res, next) => {
    const IncomingRefreshToken = req.cookies.refreshToken;
    if (!IncomingRefreshToken) {
        throw new ApiError(401, "Refresh token is missing");
    }

    const decodedToken = jwt.verify(IncomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedToken?.id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user?.refreshToken !== IncomingRefreshToken) {
        throw new ApiError(401, "Invalid refresh token");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken },
                "Access token refreshed successfully"
            )
        );
});

const updatePassword = asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Current password is incorrect");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Password updated successfully"
        )
    );
});

const updateUserDetails = asyncHandler(async (req, res, next) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "Full name and email are required");
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail && existingEmail._id.toString() !== req.user._id.toString()) {
        throw new ApiError(409, "Email is already in use by another account");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email,
            }
        },
        { new: true }
    ).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "User details updated successfully"
        )
    );
});

const getCurrentUser = asyncHandler(async (req, res, next) => {
    return res.status(200).json(
        new ApiResponse(
            200,
            req.user,
            "Current user details fetched successfully"
        )
    );
});

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) throw new ApiError(400, "Avatar file is missing");

    const currentUser = await User.findById(req.user._id);
    const oldPublicId = currentUser.avatar?.public_id;

    const newAvatar = await uploadToCloudinary(avatarLocalPath);
    if (!newAvatar) throw new ApiError(400, "Upload failed");

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { avatar: newAvatar }
        },
        { new: true }
    ).select("-password -refreshToken");

    if (oldPublicId) {
        deleteFromCloudinary(oldPublicId)
            .catch(err => console.log("Cleanup failed:", err));
    }

    return res.status(200).json(
        new ApiResponse(200, user, "Avatar updated successfully")
    );
});

const updateCoverImage = asyncHandler(async (req, res, next) => {
    const coverLocalPath = req.file?.path;
    if (!coverLocalPath) {
        throw new ApiError(400, "Cover image is required");
    }

    const currentUser = await User.findById(req.user._id);
    const oldPublicId = currentUser.coverImage?.public_id;

    const newCoverImage = await uploadToCloudinary(coverLocalPath);
    if (!newCoverImage) {
        throw new ApiError(400, "Cover image is not uploaded successfully");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { coverImage: newCoverImage }
        },
        { new: true }
    ).select("-password -refreshToken");

    if (oldPublicId) {
        deleteFromCloudinary(oldPublicId)
            .catch(err => console.log("Cleanup failed:", err));
    }

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "Cover image updated successfully"
        )
    );
});

const deleteAccount = asyncHandler(async (req, res) => {
    const { password } = req.body;

    if (!password?.trim()) {
        throw new ApiError(400, "Password is required to delete your account");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Incorrect password");
    }

    const userId = user._id;

    const ownedVideos = await Video.find({ owner: userId })
        .select("_id videoFilePublicId thumbnailPublicId");
    const videoIds = ownedVideos.map((video) => video._id);

    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            await Video.deleteMany({ owner: userId }, { session });

            await Comment.deleteMany(
                { $or: [{ owner: userId }, { video: { $in: videoIds } }] },
                { session }
            );

            await Like.deleteMany(
                { $or: [{ likedBy: userId }, { video: { $in: videoIds } }] },
                { session }
            );

            await Playlist.deleteMany({ owner: userId }, { session });

            await Subscription.deleteMany(
                { $or: [{ subscriber: userId }, { channel: userId }] },
                { session }
            );

            await Tweet.deleteMany({ owner: userId }, { session });

            if (videoIds.length > 0) {
                await User.updateMany(
                    { watchHistory: { $in: videoIds } },
                    { $pull: { watchHistory: { $in: videoIds } } },
                    { session }
                );
            }

            await User.findByIdAndDelete(userId, { session });
        });
    } finally {
        await session.endSession();
    }

    const cleanupJobs = [];

    if (user.avatar?.public_id) {
        cleanupJobs.push(deleteFromCloudinary(user.avatar.public_id, "image"));
    }
    if (user.coverImage?.public_id) {
        cleanupJobs.push(deleteFromCloudinary(user.coverImage.public_id, "image"));
    }
    ownedVideos.forEach((video) => {
        if (video.videoFilePublicId) {
            cleanupJobs.push(deleteFromCloudinary(video.videoFilePublicId, "video"));
        }
        if (video.thumbnailPublicId) {
            cleanupJobs.push(deleteFromCloudinary(video.thumbnailPublicId, "image"));
        }
    });

    const cleanupResults = await Promise.allSettled(cleanupJobs);
    cleanupResults.forEach((result) => {
        if (result.status === "rejected") {
            console.error("Cloudinary cleanup failed during account deletion:", result.reason);
        }
    });

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Account and all associated data deleted successfully"));
});

const channelProfile = asyncHandler(async (req, res, next) => {
    const { userName } = req.params;

    if (!userName.trim()) {
        throw new ApiError(400, "Username is required");
    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: userName?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" },
                channelSubscribedToCount: { $size: "$subscribedTo" },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
            }
        }
    ]);

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User channel fetched successfully")
        );
});

const getWatchHistory = asyncHandler(async (req, res, next) => {
    const user = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(req.user._id) } },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
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
                                        fullName: 1,
                                        userName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    );
});

const clearWatchHistory = asyncHandler(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { watchHistory: [] }
        },
        { new: true }
    );

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            [],
            "Watch history cleared successfully"
        )
    );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    updatePassword,
    updateUserDetails,
    getCurrentUser,
    updateAvatar,
    updateCoverImage,
    deleteAccount,
    channelProfile,
    getWatchHistory,
    clearWatchHistory,
};