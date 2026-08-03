import {Router} from "express";
import {toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos} from "../controllers/like.controller.js";
import {authMiddleware} from "../middlewares/auth.middleware.js";
import {mongoIdParamSchema} from "../validators/common.validator.js";
import validate from "../middlewares/validate.middleware.js";

const router = Router();
router.route("/videos/liked").get(authMiddleware,validate(mongoIdParamSchema("userId"), "params"), getLikedVideos);
router.route("/toggle/video/:videoId").post(authMiddleware, validate(mongoIdParamSchema("videoId"), "params"), toggleVideoLike);
router.route("/toggle/comment/:commentId").post(authMiddleware, validate(mongoIdParamSchema("commentId"), "params"), toggleCommentLike);
router.route("/toggle/tweet/:tweetId").post(authMiddleware, validate(mongoIdParamSchema("tweetId"), "params"), toggleTweetLike);

export default router;