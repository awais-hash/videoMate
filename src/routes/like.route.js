import { Router } from "express";
import { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos } from "../controllers/like.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { mongoIdParamSchema } from "../validators/common.validator.js";
import validate from "../middlewares/validate.middleware.js";

const router = Router();

/**
 * @swagger
 * /likes/videos/liked:
 *   get:
 *     summary: Get all videos liked by the current user
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Liked videos fetched successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route("/videos/liked").get(authMiddleware, getLikedVideos);

/**
 * @swagger
 * /likes/toggle/video/{videoId}:
 *   post:
 *     summary: Like or unlike a video
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - { in: path, name: videoId, required: true, schema: { type: string }, description: "MongoDB ObjectId of the video", example: 66f1a2b3c4d5e6f7a8b9c0d1 }
 *     responses:
 *       200:
 *         description: Video like toggled successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route("/toggle/video/:videoId").post(authMiddleware, validate(mongoIdParamSchema("videoId"), "params"), toggleVideoLike);

/**
 * @swagger
 * /likes/toggle/comment/{commentId}:
 *   post:
 *     summary: Like or unlike a comment
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - { in: path, name: commentId, required: true, schema: { type: string }, description: "MongoDB ObjectId of the comment", example: 66f1a2b3c4d5e6f7a8b9c0d1 }
 *     responses:
 *       200:
 *         description: Comment like toggled successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route("/toggle/comment/:commentId").post(authMiddleware, validate(mongoIdParamSchema("commentId"), "params"), toggleCommentLike);

/**
 * @swagger
 * /likes/toggle/tweet/{tweetId}:
 *   post:
 *     summary: Like or unlike a tweet
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - { in: path, name: tweetId, required: true, schema: { type: string }, description: "MongoDB ObjectId of the tweet", example: 66f1a2b3c4d5e6f7a8b9c0d1 }
 *     responses:
 *       200:
 *         description: Tweet like toggled successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route("/toggle/tweet/:tweetId").post(authMiddleware, validate(mongoIdParamSchema("tweetId"), "params"), toggleTweetLike);

export default router;