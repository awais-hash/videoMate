import { Router } from "express";
import {
  toggleSubscription,
  getSubscribedChannels,
  getChannelSubscribers,
} from "../controllers/subscription.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { mongoIdParamSchema } from "../validators/common.validator.js";
import validate from "../middlewares/validate.middleware.js";

const router = Router();

/**
 * @swagger
 * /subscriptions/c/{channelId}:
 *   get:
 *     summary: Get all subscribers of a channel
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - { in: path, name: channelId, required: true, schema: { type: string }, description: "MongoDB ObjectId of the channel", example: 66f1a2b3c4d5e6f7a8b9c0d1 }
 *     responses:
 *       200:
 *         description: Channel subscribers fetched successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route("/c/:channelId").get(authMiddleware, validate(mongoIdParamSchema("channelId"), "params"), getChannelSubscribers);

/**
 * @swagger
 * /subscriptions/u/{subscriberId}:
 *   get:
 *     summary: Get all channels a user has subscribed to
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - { in: path, name: subscriberId, required: true, schema: { type: string }, description: "MongoDB ObjectId of the subscriber (user)", example: 66f1a2b3c4d5e6f7a8b9c0d1 }
 *     responses:
 *       200:
 *         description: Subscribed channels fetched successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route("/u/:subscriberId").get(authMiddleware, validate(mongoIdParamSchema("subscriberId"), "params"), getSubscribedChannels);

/**
 * @swagger
 * /subscriptions/toggle/{channelId}:
 *   post:
 *     summary: Subscribe or unsubscribe to a channel
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - { in: path, name: channelId, required: true, schema: { type: string }, description: "MongoDB ObjectId of the channel", example: 66f1a2b3c4d5e6f7a8b9c0d1 }
 *     responses:
 *       200:
 *         description: Subscription toggled successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route("/toggle/:channelId").post(authMiddleware, validate(mongoIdParamSchema("channelId"), "params"), toggleSubscription);

export default router;