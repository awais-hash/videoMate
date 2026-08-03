import { Router } from "express";
import {
  toggleSubscription,
  getSubscribedChannels,
  getChannelSubscribers,
} from "../controllers/subscription.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {mongoIdParamSchema} from "../validators/common.validator.js";
import validate from "../middlewares/validate.middleware.js";
const router = Router();
router.route("/c/:channelId").get(authMiddleware, validate(mongoIdParamSchema("channelId"), "params"), getChannelSubscribers);
router.route("/u/:subscriberId").get(authMiddleware, validate(mongoIdParamSchema("subscriberId"), "params"), getSubscribedChannels);
router.route("/toggle/:channelId").post(authMiddleware, validate(mongoIdParamSchema("channelId"), "params"), toggleSubscription);
export default router;