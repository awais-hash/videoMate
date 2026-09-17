import * as z from "zod";
import { paginationSchema } from "./common.validator.js";
import mongoose from "mongoose";

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

const addRemoveVideoSchema = z.object({
    videoId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid Video ID"
    }),
    playlistId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid Playlist ID"
    })
});

export {
  createPlaylistSchema,
  updatePlaylistSchema,
  getUserPlaylistsQuerySchema,
  addRemoveVideoSchema
};