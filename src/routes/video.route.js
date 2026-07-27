import {Router} from 'express';
import {authMiddleware} from '../middlewares/auth.middleware.js';
import { optionalAuth } from '../middlewares/optionalAuth.middleware.js';
import {upload} from '../middlewares/multer.middleware.js';
import {publishVideo,
    getVideoById,
    getAllVideos,
    updateVideoDetails,
    togglePublishStatus,
    deleteVideo} from '../controllers/video.controller.js';
import { uploadLimiter } from '../middlewares/rateLimit.middleware.js';    

    const router = Router();

    router.route('/publish').post(uploadLimiter, authMiddleware, upload.fields([
        {name: "videoFile", maxCount: 1},
        {name: "thumbnail", maxCount: 1}
        ]), publishVideo);
    router.route('/').get(getAllVideos);
    router.route('/:videoId')
    .get(optionalAuth, getVideoById)
    .patch(uploadLimiter,authMiddleware, upload.single("thumbnail"), updateVideoDetails)
    .delete(authMiddleware, deleteVideo);
    router.route('/:videoId/publish').patch(authMiddleware, togglePublishStatus);    

    export default router;