import * as z from "zod";
import { paginationSchema } from "./common.validator.js";

const publishVideoSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long").max(100).trim(),
  description: z.string().max(5000).trim().optional(),
});


const publishVideoFilesSchema = z.object({
  videoFile: z
    .array(
      z.object({
        path: z.string(),
        mimetype: z.string().refine(
          (type) => type.startsWith("video/"),
          "videoFile must be a valid video file"
        ),
      })
    )
    .min(1, "Video file is required"),
  thumbnail: z
    .array(
      z.object({
        path: z.string(),
        mimetype: z.string().refine(
          (type) => type.startsWith("image/"),
          "thumbnail must be a valid image file"
        ),
      })
    )
    .min(1, "Thumbnail is required"),
});

const updateVideoDetailsSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long").max(100).trim().optional(),
  description: z.string().max(5000).trim().optional(),
});

const getAllVideosQuerySchema = paginationSchema.extend({
  query: z.string().trim().optional(),
  sortBy: z.enum(["createdAt", "views", "duration", "title"]).default("createdAt"),
  userId: z
    .string()
    .refine((val) => /^[0-9a-fA-F]{24}$/.test(val), "Invalid userId format")
    .optional(),
});

export {
  publishVideoSchema,
  publishVideoFilesSchema, 
  updateVideoDetailsSchema,
  getAllVideosQuerySchema,
};