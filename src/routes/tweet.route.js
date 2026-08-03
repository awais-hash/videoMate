import { Router } from "express";
import {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet,
} from "../controllers/tweet.controller.js";
import { authMiddleWare } from "../middlewares/auth.middleware.js";
import { createTweetSchema, updateTweetSchema } from "../validators/tweet.validator.js";
import {mongoIdParamSchema} from "../validators/common.validator.js";
import validate from "../middlewares/validate.middleware.js";


const router = Router();

router.route("/").post(authMiddleware, validate(createTweetSchema), createTweet);
router.route("/user/:userId").get(validate(mongoIdParamSchema("userId"), "params"),getUserTweets);
router.route("/:tweetId").patch(authMiddleware, validate(mongoIdParamSchema("tweetId"), "params"), validate(updateTweetSchema), updateTweet);
router.route("/:tweetId").delete(authMiddleware, validate(mongoIdParamSchema("tweetId"), "params"),deleteTweet);

export default router;