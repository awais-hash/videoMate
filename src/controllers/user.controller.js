import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {User} from "../models/user.model.js";
import mongoose from "mongoose";
import {uploadToCloudinary} from "../utils/cloudinaryUpload.js";
import bcrypt from "bcrypt";

const registerUser = asyncHandler(async (req,res,next)=>{
   // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response with user details and success message

    const {userName,email,password,fullName} = req.body;
    if ([userName,email,password,fullName].some((field)=> field?.trim() == ""))
{
    throw new ApiError(400, "All fields are required"); 
}
    const hashedPassword = await bcrypt.hash(password, 10);


const existingUser = await User.findOne({$or: [{userName}, {email}]});
if (existingUser)
{
    throw new ApiError(409, "User with the same username or email already exists");

}


const avatarLocalPath = req.files?.avatar?.[0]?.path;
const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

if (!avatarLocalPath){
    throw new ApiError(400, "Avatar image is required");
}

const avatar= await uploadToCloudinary(avatarLocalPath);
const coverImage = await uploadToCloudinary(coverImageLocalPath);

if (!avatar){
    throw new ApiError(400, "Avatar image is required");
}

const user = await User.create({
    userName,
    fullName,
    email,
    password: hashedPassword,
    avatar: avatar.url,
    coverImage: coverImage?.url


})

const createdUser = await User.findById(user._id).select("-password -refreshToken");

if (!createdUser) { 
    throw new ApiError(500, "User creation failed");
}

return res.status(201).json(
    new ApiResponse(
     200,
     "User registered successfully",
     createdUser
)
)





































































})






export {registerUser};