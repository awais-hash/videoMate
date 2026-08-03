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
import validate from '../middlewares/validate.middleware.js';
import { mongoIdParamSchema } from '../validators/common.validator.js';
import { publishVideoSchema, updateVideoDetailsSchema, getAllVideosQuerySchema } from '../validators/video.validator.schema.js';

    const router = Router();

    router.route('/publish').post(uploadLimiter, authMiddleware,validate(publishVideoSchema), upload.fields([
        {name: "videoFile", maxCount: 1},
        {name: "thumbnail", maxCount: 1}
        ]), publishVideo);
    router.route('/').get(getAllVideos);
    router.route('/:videoId')
    .get(validate(mongoIdParamSchema("videoId"), "params"),optionalAuth, getVideoById)
    .patch(uploadLimiter,authMiddleware,
           validate(mongoIdParamSchema("videoId"), "params"),     
           validate(updateVideoDetailsSchema), upload.single("thumbnail"), 
           updateVideoDetails
        )
    .delete(authMiddleware,validate(mongoIdParamSchema("videoId"), "params"), deleteVideo);
    router.route('/:videoId/publish').
    patch(authMiddleware, 
          validate(mongoIdParamSchema("videoId"), "params"),
     togglePublishStatus);    

    export default router;