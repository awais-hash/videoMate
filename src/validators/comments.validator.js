import * as z from "zod";
import { paginationSchema } from "./common.validator.js";

const addCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment cannot exceed 500 characters")
    .trim(),
});

const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(500).trim(),
});

const getVideoCommentsQuerySchema = paginationSchema.extend({
  sortBy: z.enum(["createdAt"]).default("createdAt"),
});

export{ addCommentSchema, updateCommentSchema, getVideoCommentsQuerySchema };