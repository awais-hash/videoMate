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

const cookieOptions = {
    httpOnly: true,
    secure: true,
};

/* ----------------------------- helpers ----------------------------- */

// Cloudinary response -> the exact shape stored in the User model
const toImage = (result) => ({
    public_id: result?.public_id ?? "",
    url: result?.secure_url ?? result?.url ?? "",
});

// Cleanup must never break the request
const safeDelete = async (publicId, resourceType = "image") => {
    if (!publicId) return;
    try {
        await deleteFromCloudinary(publicId, resourceType);
    } catch (err) {
        console.error("Cloudinary cleanup failed:", err);
    }
};

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

/* ------------------------------- auth ------------------------------- */

const registerUser = asyncHandler(async (req, res) => {
    const { userName, email, password, fullName } = req.body;

    if (!password?.trim() || !fullName?.trim()) {
        throw new ApiError(400, "Full name and password are required");
    }

    if (!userName?.trim() && !email?.trim()) {
        throw new ApiError(400, "Either username or email is required");
    }

    const orConditions = [];
    if (userName?.trim()) orConditions.push({ userName: userName.trim().toLowerCase() });
    if (email?.trim()) orConditions.push({ email: email.trim().toLowerCase() });

    const existingUser = await User.findOne({ $or: orConditions });
    if (existingUser) {
        throw new ApiError(409, "User with the same username or email already exists");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
    }

    const avatarUpload = await uploadToCloudinary(avatarLocalPath);
    if (!avatarUpload) {
        throw new ApiError(400, "Avatar upload failed");
    }

    // Cover image is optional: only upload if it was actually sent
    const coverUpload = coverImageLocalPath
        ? await uploadToCloudinary(coverImageLocalPath)
        : null;

    let user;
    try {
        user = await User.create({
            userName,
            fullName,
            email,
            password,
            avatar: toImage(avatarUpload),
            coverImage: toImage(coverUpload),
        });
    } catch (error) {
        // Don't leave orphan files on Cloudinary if the DB write fails
        await Promise.allSettled([
            safeDelete(avatarUpload.public_id),
            safeDelete(coverUpload?.public_id),
        ]);
        if (error?.code === 11000) {
            throw new ApiError(409, "User with the same username or email already exists");
        }
        throw error;
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    if (!loggedInUser) {
        throw new ApiError(500, "User creation failed");
    }

    return res
        .status(201)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                201,
                { user: loggedInUser },
                "User registered and logged in successfully"
            )
        );
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, userName, password } = req.body;

    if (!password?.trim()) {
        throw new ApiError(400, "Password is required");
    }

    if (!email?.trim() && !userName?.trim()) {
        throw new ApiError(400, "Either email or username is required");
    }

    const orConditions = [];
    if (email?.trim()) orConditions.push({ email: email.trim().toLowerCase() });
    if (userName?.trim()) orConditions.push({ userName: userName.trim().toLowerCase() });

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

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
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

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, null, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is missing");
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, "Invalid or expired refresh token");
    }

    const user = await User.findById(decodedToken?.id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401, "Invalid refresh token");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken },
                "Access token refreshed successfully"
            )
        );
});

/* ------------------------------ profile ------------------------------ */

const updatePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Current password is incorrect");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password updated successfully"));
});

const updateUserDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName?.trim() || !email?.trim()) {
        throw new ApiError(400, "Full name and email are required");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail && existingEmail._id.toString() !== req.user._id.toString()) {
        throw new ApiError(409, "Email is already in use by another account");
    }

    let user;
    try {
        user = await User.findByIdAndUpdate(
            req.user?._id,
            { $set: { fullName: fullName.trim(), email: normalizedEmail } },
            { new: true }
        ).select("-password -refreshToken");
    } catch (error) {
        // Race condition: two requests passed the check above at the same time
        if (error?.code === 11000) {
            throw new ApiError(409, "Email is already in use by another account");
        }
        throw error;
    }

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User details updated successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user details fetched successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) throw new ApiError(400, "Avatar file is missing");

    const currentUser = await User.findById(req.user._id);
    if (!currentUser) throw new ApiError(404, "User not found");
    const oldPublicId = currentUser.avatar?.public_id;

    const upload = await uploadToCloudinary(avatarLocalPath);
    if (!upload) throw new ApiError(400, "Upload failed");

    let user;
    try {
        user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { avatar: toImage(upload) } },
            { new: true }
        ).select("-password -refreshToken");
    } catch (error) {
        await safeDelete(upload.public_id); // new image would be orphaned
        throw error;
    }

    await safeDelete(oldPublicId);

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
    const coverLocalPath = req.file?.path;
    if (!coverLocalPath) {
        throw new ApiError(400, "Cover image is required");
    }

    const currentUser = await User.findById(req.user._id);
    if (!currentUser) throw new ApiError(404, "User not found");
    const oldPublicId = currentUser.coverImage?.public_id;

    const upload = await uploadToCloudinary(coverLocalPath);
    if (!upload) {
        throw new ApiError(400, "Cover image is not uploaded successfully");
    }

    let user;
    try {
        user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { coverImage: toImage(upload) } },
            { new: true }
        ).select("-password -refreshToken");
    } catch (error) {
        await safeDelete(upload.public_id);
        throw error;
    }

    await safeDelete(oldPublicId);

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover image updated successfully"));
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

    const ownedVideos = await Video.find({ owner: userId }).select(
        "_id videoFilePublicId thumbnailPublicId"
    );
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

            if (videoIds.length > 0) {
                // Other users' playlists / history must not point at deleted videos
                await Playlist.updateMany(
                    { videos: { $in: videoIds } },
                    { $pull: { videos: { $in: videoIds } } },
                    { session }
                );

                await User.updateMany(
                    { watchHistory: { $in: videoIds } },
                    { $pull: { watchHistory: { $in: videoIds } } },
                    { session }
                );
            }

            await Subscription.deleteMany(
                { $or: [{ subscriber: userId }, { channel: userId }] },
                { session }
            );

            await Tweet.deleteMany({ owner: userId }, { session });

            await User.findByIdAndDelete(userId, { session });
        });
    } finally {
        await session.endSession();
    }

    // DB is already clean; Cloudinary cleanup is best-effort
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

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "Account and all associated data deleted successfully"));
});

/* ------------------------- channel & history ------------------------- */

const channelProfile = asyncHandler(async (req, res) => {
    const userName = req.params.userName?.trim().toLowerCase();

    if (!userName) {
        throw new ApiError(400, "Username is required");
    }

    const channel = await User.aggregate([
        { $match: { userName } },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" },
                channelSubscribedToCount: { $size: "$subscribedTo" },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false,
                    },
                },
            },
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
            },
        },
    ]);

    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "User channel fetched successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
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
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            owner: { $first: "$owner" },
                        },
                    },
                ],
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0]?.watchHistory ?? [],
                "Watch history fetched successfully"
            )
        );
});

const clearWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { watchHistory: [] } },
        { new: true }
    );

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, [], "Watch history cleared successfully"));
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