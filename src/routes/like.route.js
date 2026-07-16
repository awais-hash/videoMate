import {Router} from "express";
import {toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos} from "../controllers/like.controller.js";
import {authMiddleware} from "../middlewares/auth.middleware.js";

const router = Router();
router.route("/videos/liked").get(authMiddleware, getLikedVideos);
router.route("/toggle/video/:videoId").post(authMiddleware, toggleVideoLike);
router.route("/toggle/comment/:commentId").post(authMiddleware, toggleCommentLike);
router.route("/toggle/tweet/:tweetId").post(authMiddleware, toggleTweetLike);

export default router;