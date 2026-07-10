import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
import { ApiError } from '../utils/ApiError.js';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

export const uploadToCloudinary = async (localFilePath) => {

try {
    if(!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath,{
        resourse_type : "auto"
    })

    return {
        url: response.secure_url,
        public_id: response.public_id
    }

} catch (error) {

    throw new ApiError("Failed to upload to Cloudinary", 500);

    console.error("Error uploading to Cloudinary:", error);
} finally {
  
    if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
    }

}

}


export const deleteFromCloudinary = async (publicId) => {

try {
    if(!publicId) {
        console.error("Public ID is required to delete from Cloudinary");
        return null;
    };
    const response = await cloudinary.uploader.destroy(publicId,{
        resourse_type : "auto",
        invalidate: true
    })

    return response;

} catch (error) {

    console.error("Error deleting from Cloudinary:", error);
    return null;
}

} // is trha utility function banai gai h jo ki cloudinary se file delete krne k liye use hoti h