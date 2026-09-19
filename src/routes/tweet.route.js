import { Router } from "express";
import {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet,
} from "../controllers/tweet.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { createTweetSchema, updateTweetSchema } from "../validators/tweet.validator.js";
import { mongoIdParamSchema } from "../validators/common.validator.js";
import validate from "../middlewares/validate.middleware.js";

const router = Router();

/**
 * @swagger
 * /tweets:
 *   post:
 *     summary: Create a new tweet
 *     tags: [Tweets]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, example: "Hello world!" }
 *     responses:
 *       201:
 *         description: Tweet created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route("/").post(authMiddleware, validate(createTweetSchema), createTweet);

/**
 * @swagger
 * /tweets/user/{userId}:
 *   get:
 *     summary: Get all tweets of a user
 *     tags: [Tweets]
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: string }, description: "MongoDB ObjectId of the user", example: 66f1a2b3c4d5e6f7a8b9c0d1 }
 *     responses:
 *       200:
 *         description: User tweets fetched successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route("/user/:userId").get(validate(mongoIdParamSchema("userId"), "params"), getUserTweets);

/**
 * @swagger
 * /tweets/{tweetId}:
 *   patch:
 *     summary: Update a tweet
 *     tags: [Tweets]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - { in: path, name: tweetId, required: true, schema: { type: string }, description: "MongoDB ObjectId of the tweet", example: 66f1a2b3c4d5e6f7a8b9c0d1 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, example: "Edited tweet text" }
 *     responses:
 *       200:
 *         description: Tweet updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Only the tweet owner can update it
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route("/:tweetId").patch(authMiddleware, validate(mongoIdParamSchema("tweetId"), "params"), validate(updateTweetSchema), updateTweet);

/**
 * @swagger
 * /tweets/{tweetId}:
 *   delete:
 *     summary: Delete a tweet
 *     tags: [Tweets]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - { in: path, name: tweetId, required: true, schema: { type: string }, description: "MongoDB ObjectId of the tweet", example: 66f1a2b3c4d5e6f7a8b9c0d1 }
 *     responses:
 *       200:
 *         description: Tweet deleted successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Only the tweet owner can delete it
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route("/:tweetId").delete(authMiddleware, validate(mongoIdParamSchema("tweetId"), "params"), deleteTweet);

export default router;