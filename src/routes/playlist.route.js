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
const router = Router();
router.route("/").post(authMiddleware, createPlaylist);
router.route("/user/:userId").get(getUserPlaylists);
router.route("/:playlistId").get(getPlaylistById);
router.route("/add/:videoId/:playlistId").patch(authMiddleware, addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(authMiddleware, removeVideoFromPlaylist);
router.route("/:playlistId").delete(authMiddleware, deletePlaylist);
router.route("/:playlistId").patch(authMiddleware, updatePlaylist);
export default router;