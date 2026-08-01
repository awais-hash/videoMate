import * as z from "zod";
import { paginationSchema } from "./common.validator.js";

export const publishVideoSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long").max(100).trim(),
  description: z.string().max(5000).trim().optional(),
});

export const updateVideoDetailsSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long").max(100).trim().optional(),
  description: z.string().max(5000).trim().optional(),
});

export const getAllVideosQuerySchema = paginationSchema.extend({
  query: z.string().trim().optional(),
  sortBy: z.enum(["createdAt", "views", "duration", "title"]).default("createdAt"), // override
  userId: z
    .string()
    .refine((val) => /^[0-9a-fA-F]{24}$/.test(val), "Invalid userId format")
    .optional(),
});