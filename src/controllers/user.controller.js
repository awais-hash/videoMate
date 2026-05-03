import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {User} from "../models/user.model.js";
import mongoose from "mongoose";
import {uploadToCloudinary} from "../utils/cloudinaryUpload.js";

const generateAccessAndRefreshToken = async(userId)=>{
  try {
      const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
 
    await user.save({validateBeforeSave : false});
    return {accessToken, refreshToken};
  } catch (error) {
    throw new ApiError(500, "Failed to generate access and refresh tokens");
  }
}

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
    password: password,
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
     createdUser,
     "User registered successfully"
     
)
)

}
)

const loginUser = asyncHandler(async()=>{
    // get login details from frontend
    // validation - not empty
    // check if user exists with email or username
    // compare password
    // generate refresh token and access token
    // save refresh token in db
    // return response with user details, access token and success message



    const {email,userName,password} = req.body;

    if ([email,userName,password].some((field)=> field?.trim() == ""))
{
    throw new ApiError(400, "All fields are required"); }

const user = await User.findOne({$or: [{email}, {userName}]});
if (!user){
    throw new ApiError(404, "User not found");}

    const comparePassword = await user.isPasswordCorrect(password);
if (!comparePassword){
    throw new ApiError(401, "Invalid credentials");
}

const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

// AGAIN TAKING USER DETAILS TO EXCLUDE PASSWORD AND REFRESH TOKEN FROM RESPONSE
const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
const options = {
    httpOnly: true,
    secure : true
}
})

const logoutUser = asyncHandler(async (req,res,next)=>{
await User.findByIdAndUpdate(req.user._id, {refreshToken: null}, {new: true});
    const options = {
        httpOnly: true,
        secure: true
    }

return res.status(200)
.clearCookie("accessToken", options).
clearCookie("refreshToken", options).json(
    new ApiResponse(
        200,
        null,
        "User logged out successfully"
)
)

})





export {registerUser, loginUser};