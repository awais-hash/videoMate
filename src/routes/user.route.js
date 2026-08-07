import {Router}  from 'express';
import {registerUser,
        loginUser,
        logoutUser, 
        refreshAccessToken, 
        updatePassword, 
        updateUserDetails, 
        getCurrentUser, 
        updateAvatar, 
        updateCoverImage, 
        channelProfile, 
        getWatchHistory, 
        clearWatchHistory} from '../controllers/user.controller.js';
import {upload} from '../middlewares/multer.middleware.js';
import {authMiddleware} from '../middlewares/auth.middleware.js';
import { authLimiter, uploadLimiter } from '../middlewares/rateLimit.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
    registerSchema,
    loginSchema,
    updatePasswordSchema,
    updateUserDetailsSchema,
    channelProfileParamsSchema
} from '../validators/user.validator.schema.js';


const router = Router();
router.route("/register").post(
    authLimiter,
    uploadLimiter,
    upload.fields([
        {name: "avatar", maxCount: 1},
        {name: "coverImage", maxCount: 1}
        ]),
        validate(registerSchema),
    registerUser);
    router.route("/login").post(authLimiter,validate(loginSchema),loginUser);
    router.route("/logout").post(authMiddleware, logoutUser);
    router.route("/refresh-access-token").post(authLimiter, refreshAccessToken);
    router.route("/update-password").post(authLimiter, authMiddleware,validate(updatePasswordSchema),updatePassword);
    router.route("/update-details").post(authMiddleware, validate(updateUserDetailsSchema), updateUserDetails);
    router.route("/current-user").get(authMiddleware, getCurrentUser);
    // router.route("/delete-account").delete(authMiddleware, deleteAccount);
    router.route("/update-avatar").patch(uploadLimiter, authMiddleware, upload.single("avatar"), updateAvatar);
    router.route("/update-cover-image").patch(uploadLimiter, authMiddleware, upload.single("coverImage"), updateCoverImage);
    router.route("/c/:username").get(authMiddleware,validate(channelProfileParamsSchema, "params"), channelProfile);
    router.route("/history").get(authMiddleware, getWatchHistory)
    router.route("/history-clear").patch(authMiddleware, clearWatchHistory)

export default router;
