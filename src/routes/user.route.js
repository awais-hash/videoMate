import {Router}  from 'express';
import {registerUser,loginUser,logoutUser, refreshAccessToken, updatePassword, updateUserDetails, getCurrentUser, updateAvatar, updateCoverImage, channelProfile, getWatchHistory} from '../controllers/user.controller.js';
import {upload} from '../middlewares/multer.middleware.js';
import {authMiddleware} from '../middlewares/auth.middleware.js';

const router = Router();
router.route("/register").post(
    
    upload.fields([
        {name: "avatar", maxCount: 1},
        {name: "coverImage", maxCount: 1}
            // i will later accept 3 to 4 coverimags
        ]),
    registerUser);
    router.route("/login").post(loginUser);
    router.route("/logout").post(authMiddleware, logoutUser);
    router.route("/refresh-access-token").post(refreshAccessToken);
    router.route("/update-password").post(authMiddleware, updatePassword);
    router.route("/update-details").post(authMiddleware, updateUserDetails);
    router.route("/current-user").get(authMiddleware, getCurrentUser);
    router.route("/update-avatar").patch(authMiddleware, upload.single("avatar"), updateAvatar);
    router.route("/update-cover-image").patch(authMiddleware, upload.single("coverImage"), updateCoverImage);
    router.route("/c/:username").get(authMiddleware, channelProfile);
    router.route("/history").get(authMiddleware, getWatchHistory)

export default router;
