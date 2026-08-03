import * as z from "zod";
import { paginationSchema } from "./common.validator.js";

const createPlaylistSchema = z.object({
  name: z.string().min(1, "Playlist name is required").max(100).trim(),
  description: z.string().max(500).trim().optional(),
});

const updatePlaylistSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).trim().optional(),
});

const getUserPlaylistsQuerySchema = paginationSchema.extend({
  sortBy: z.enum(["createdAt", "name"]).default("createdAt"),
});

export {
  createPlaylistSchema,
  updatePlaylistSchema,
  getUserPlaylistsQuerySchema,
};