import * as z from "zod";
import { paginationSchema } from "./common.validator.js";

export const createPlaylistSchema = z.object({
  name: z.string().min(1, "Playlist name is required").max(100).trim(),
  description: z.string().max(500).trim().optional(),
});

export const getUserPlaylistsQuerySchema = paginationSchema.extend({
  sortBy: z.enum(["createdAt", "name"]).default("createdAt"),
});