import { Router } from "express";
import {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {mongoIdParamSchema} from "../validators/common.validator.js";
import { createPlaylistSchema, updatePlaylistSchema,getUserPlaylistsQuerySchema } from "../validators/playlist.validator.js";
import validate from "../middlewares/validate.middleware.js";
const router = Router();
router.route("/").post(authMiddleware,validate(createPlaylistSchema), createPlaylist);
router.route("/user/:userId").get(validate(getUserPlaylistsQuerySchema), getUserPlaylists);
router.route("/:playlistId").get(validate(mongoIdParamSchema("playlistId"), "params"), getPlaylistById);
router.route("/add/:videoId/:playlistId").patch(authMiddleware, validate(mongoIdParamSchema("videoId"), "params"), validate(mongoIdParamSchema("playlistId"), "params"), addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(authMiddleware, validate(mongoIdParamSchema("videoId"), "params"), validate(mongoIdParamSchema("playlistId"), "params"), removeVideoFromPlaylist);
router.route("/:playlistId").delete(authMiddleware, validate(mongoIdParamSchema("playlistId"), "params"), deletePlaylist);
router.route("/:playlistId").patch(authMiddleware, validate(mongoIdParamSchema("playlistId"), "params"), validate(updatePlaylistSchema), updatePlaylist);
export default router;