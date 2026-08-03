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
import {mongoIdParamSchema} from "../validators/common.validator.js"; 
import validate from "../middlewares/validate.middleware.js";


const router = Router();

router.route("/:videoId").get(getVideoComments);
router.route("/:videoId").post(authMiddleware,  
    validate(mongoIdParamSchema("videoId"), "params"),
    validate(addCommentSchema), addComment);
router.route("/c/:commentId").patch(authMiddleware,
    validate(mongoIdParamSchema("commentId"), "params"),
    validate(updateCommentSchema), updateComment);
router.route("/c/:commentId").delete(authMiddleware,
    validate(mongoIdParamSchema("commentId"), "params"), deleteComment);

export default router;