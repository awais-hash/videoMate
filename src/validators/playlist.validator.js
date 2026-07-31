import * as z from "zod";

export const createPlaylistSchema = z.object({
  name: z.string().min(1, "Playlist name is required").max(100).trim(),
  description: z.string().max(500).trim().optional(),
});

export const updatePlaylistSchema = z.object({
  name: z.string().min(1, "Playlist name is required").max(100).trim().optional(),
  description: z.string().max(500).trim().optional(),
});