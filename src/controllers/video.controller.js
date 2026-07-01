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

const videoFileLocalPath = req.files?.videoFile?.[0]?.path; 
const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;   
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

if (!videoFile?.url || !thumbnail?.url) {
    throw new ApiError(500, "Failed to upload video or thumbnail");
}

    const createdVideo = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
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