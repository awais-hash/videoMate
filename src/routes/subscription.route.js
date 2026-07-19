import { Router } from "express";
import {
  toggleSubscription,
  getSubscribedChannels,
  getChannelSubscribers,
} from "../controllers/subscription.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
const router = Router();
router.route("/c/:channelId").get(authMiddleware, getChannelSubscribers);
router.route("/u/:subscriberId").get(authMiddleware, getSubscribedChannels);
router.route("/toggle/:channelId").post(authMiddleware, toggleSubscription);
export default router;