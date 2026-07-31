import * as z from "zod";

export const publishVideoSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long").max(100).trim(),
  description: z.string().max(5000).trim().optional(),
});

export const updateVideoDetailsSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long").max(100).trim().optional(),
  description: z.string().max(5000).trim().optional(),
});

export const getAllVideosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  query: z.string().trim().optional(),          // search term
  sortBy: z.enum(["createdAt", "views", "duration", "title"]).default("createdAt"),
  sortType: z.enum(["asc", "desc"]).default("desc"),
  userId: z
    .string()
    .refine((val) => /^[0-9a-fA-F]{24}$/.test(val), "Invalid user ID format")
    .optional(),
});