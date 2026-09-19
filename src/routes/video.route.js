import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { optionalAuth } from "../middlewares/optionalAuth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  publishVideo,
  getVideoById,
  getAllVideos,
  updateVideoDetails,
  togglePublishStatus,
  deleteVideo,
} from "../controllers/video.controller.js";
import { uploadLimiter } from "../middlewares/rateLimit.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { mongoIdParamSchema } from "../validators/common.validator.js";
import { publishVideoSchema, publishVideoFilesSchema, updateVideoDetailsSchema, getAllVideosQuerySchema } from "../validators/video.validator.schema.js";

const router = Router();

/**
 * @swagger
 * /videos/publish:
 *   post:
 *     summary: Upload and publish a new video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, description, videoFile, thumbnail]
 *             properties:
 *               title: { type: string, example: "My first video" }
 *               description: { type: string, example: "Video description here" }
 *               videoFile: { type: string, format: binary }
 *               thumbnail: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Video published successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         description: Too many requests (rate limit)
 */
router.route("/publish").post(
    uploadLimiter,
    authMiddleware,
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 },
    ]),
    validate(publishVideoFilesSchema, "files"),
    validate(publishVideoSchema, "body"),
    publishVideo
);

/**
 * @swagger
 * /videos:
 *   get:
 *     summary: Get all published videos
 *     tags: [Videos]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 }, description: "Page number" }
 *       - { in: query, name: limit, schema: { type: integer, default: 10 }, description: "Videos per page" }
 *       - { in: query, name: query, schema: { type: string }, description: "Search text for title or description" }
 *       - { in: query, name: sortBy, schema: { type: string, example: createdAt }, description: "Field to sort by" }
 *       - { in: query, name: sortType, schema: { type: string, enum: [asc, desc] }, description: "Sort direction" }
 *       - { in: query, name: userId, schema: { type: string }, description: "Only videos of this user (ObjectId)" }
 *     responses:
 *       200:
 *         description: Videos fetched successfully
 */
router.route("/").get(getAllVideos);

/**
 * @swagger
 * /videos/{videoId}:
 *   get:
 *     summary: Get a video by id
 *     description: Login zaroori nahi, lekin login ho to watch history update hoti hai.
 *     tags: [Videos]
 *     security:
 *       - {}
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - { in: path, name: videoId, required: true, schema: { type: string }, description: "MongoDB ObjectId of the video", example: 66f1a2b3c4d5e6f7a8b9c0d1 }
 *     responses:
 *       200:
 *         description: Video fetched successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   patch:
 *     summary: Update video details (title, description, thumbnail)
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - { in: path, name: videoId, required: true, schema: { type: string }, description: "MongoDB ObjectId of the video", example: 66f1a2b3c4d5e6f7a8b9c0d1 }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, example: "Updated title" }
 *               description: { type: string, example: "Updated description" }
 *               thumbnail: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Video updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Only the video owner can update it
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         description: Too many requests (rate limit)
 *
 *   delete:
 *     summary: Delete a video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - { in: path, name: videoId, required: true, schema: { type: string }, description: "MongoDB ObjectId of the video", example: 66f1a2b3c4d5e6f7a8b9c0d1 }
 *     responses:
 *       200:
 *         description: Video deleted successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Only the video owner can delete it
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route("/:videoId")
    .get(validate(mongoIdParamSchema("videoId"), "params"), optionalAuth, getVideoById)
    .patch(
        uploadLimiter,
        authMiddleware,
        validate(mongoIdParamSchema("videoId"), "params"),
        upload.single("thumbnail"),
        validate(updateVideoDetailsSchema),
        updateVideoDetails
    )
    .delete(authMiddleware, validate(mongoIdParamSchema("videoId"), "params"), deleteVideo);

/**
 * @swagger
 * /videos/{videoId}/publish:
 *   patch:
 *     summary: Toggle a video's publish status
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - { in: path, name: videoId, required: true, schema: { type: string }, description: "MongoDB ObjectId of the video", example: 66f1a2b3c4d5e6f7a8b9c0d1 }
 *     responses:
 *       200:
 *         description: Publish status toggled successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Only the video owner can change publish status
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route("/:videoId/publish").patch(
    authMiddleware,
    validate(mongoIdParamSchema("videoId"), "params"),
    togglePublishStatus
);

export default router;