import * as z from "zod";
import { paginationSchema } from "./common.validator.js";

export const addCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment cannot exceed 500 characters")
    .trim(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(500).trim(),
});

export const getVideoCommentsQuerySchema = paginationSchema.extend({
  sortBy: z.enum(["createdAt"]).default("createdAt"),
});