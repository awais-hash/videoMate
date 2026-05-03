import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';


export const authMiddleware = async(req, res, next) => {
try {
    const token = req.cookies?.accessToken || req.headers?.authorization?.replace("Bearer ", "");

if (!token) {
    return next(new ApiError(401, "Unauthorized: No token provided"));
}
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodedToken._id).select("-password -refreshToken");
    if (!user) {
        return next(new ApiError(401, "Unauthorized: User not found"));
    }
    req.user = user;
    next();
} catch (error) {
    return next(new ApiError(401, "Unauthorized: Invalid token"));
}}
