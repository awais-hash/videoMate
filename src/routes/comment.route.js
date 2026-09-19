import { Router } from "express";
import {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { addCommentSchema, updateCommentSchema,
         getVideoCommentsQuerySchema } from "../validators/comments.validator.js";
import { mongoIdParamSchema } from "../validators/common.validator.js";
import validate from "../middlewares/validate.middleware.js";

const router = Router();

/**
 * @swagger
 * /comments/{videoId}:
 *   get:
 *     summary: Get all comments of a video
 *     tags: [Comments]
 *     parameters:
 *       - { in: path, name: videoId, required: true, schema: { type: string }, description: "MongoDB ObjectId of the video", example: 66f1a2b3c4d5e6f7a8b9c0d1 }
 *       - { in: query, name: page, schema: { type: integer, default: 1 }, description: "Page number" }
 *       - { in: query, name: limit, schema: { type: integer, default: 10 }, description: "Comments per page" }
 *     responses:
 *       200:
 *         description: Comments fetched successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route("/:videoId").get(getVideoComments);

/**
 * @swagger
 * /comments/{videoId}:
 *   post:
 *     summary: Add a comment on a video
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - { in: path, name: videoId, required: true, schema: { type: string }, description: "MongoDB ObjectId of the video", example: 66f1a2b3c4d5e6f7a8b9c0d1 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, example: "Great video!" }
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route("/:videoId").post(authMiddleware,
    validate(mongoIdParamSchema("videoId"), "params"),
    validate(addCommentSchema), addComment);

/**
 * @swagger
 * /comments/c/{commentId}:
 *   patch:
 *     summary: Update a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - { in: path, name: commentId, required: true, schema: { type: string }, description: "MongoDB ObjectId of the comment", example: 66f1a2b3c4d5e6f7a8b9c0d1 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, example: "Updated comment text" }
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Only the comment owner can update it
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route("/c/:commentId").patch(authMiddleware,
    validate(mongoIdParamSchema("commentId"), "params"),
    validate(updateCommentSchema), updateComment);

/**
 * @swagger
 * /comments/c/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - { in: path, name: commentId, required: true, schema: { type: string }, description: "MongoDB ObjectId of the comment", example: 66f1a2b3c4d5e6f7a8b9c0d1 }
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Only the comment owner can delete it
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route("/c/:commentId").delete(authMiddleware,
    validate(mongoIdParamSchema("commentId"), "params"), deleteComment);

export default router;