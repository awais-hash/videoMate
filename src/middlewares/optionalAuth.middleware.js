import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

export const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if (!token) return next(); 

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded._id).select("-password -refreshToken");
        if (user) req.user = user;
        next();
    } catch (error) {
        next();
    }
};
