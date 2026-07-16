import { Router } from "express";
import {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/:videoId").get(getVideoComments);
router.route("/:videoId").post(authMiddleware, addComment);
router.route("/c/:commentId").patch(authMiddleware, updateComment);
router.route("/c/:commentId").delete(authMiddleware, deleteComment);

export default router;