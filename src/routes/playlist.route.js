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
import { mongoIdParamSchema } from "../validators/common.validator.js";
import { createPlaylistSchema, updatePlaylistSchema, addRemoveVideoSchema } from "../validators/playlist.validator.js";
import validate from "../middlewares/validate.middleware.js";

const router = Router();

/**
 * @swagger
 * /playlists:
 *   post:
 *     summary: Create a new playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "My Favourites" }
 *               description: { type: string, example: "Best videos of the month" }
 *     responses:
 *       201:
 *         description: Playlist created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route("/").post(authMiddleware, validate(createPlaylistSchema), createPlaylist);

/**
 * @swagger
 * /playlists/user/{userId}:
 *   get:
 *     summary: Get all playlists of a user
 *     tags: [Playlists]
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: string }, description: "MongoDB ObjectId of the user", example: 66f1a2b3c4d5e6f7a8b9c0d1 }
 *     responses:
 *       200:
 *         description: User playlists fetched successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route("/user/:userId").get(getUserPlaylists);

/**
 * @swagger
 * /playlists/{playlistId}:
 *   get:
 *     summary: Get a playlist by id
 *     tags: [Playlists]
 *     parameters:
 *       - { in: path, name: playlistId, required: true, schema: { type: string }, description: "MongoDB ObjectId of the playlist", example: 66f1a2b3c4d5e6f7a8b9c0d1 }
 *     responses:
 *       200:
 *         description: Playlist fetched successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route("/:playlistId").get(validate(mongoIdParamSchema("playlistId"), "params"), getPlaylistById);

/**
 * @swagger
 * /playlists/add/{videoId}/{playlistId}:
 *   patch:
 *     summary: Add a video to a playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - { in: path, name: videoId, required: true, schema: { type: string }, description: "MongoDB ObjectId of the video", example: 66f1a2b3c4d5e6f7a8b9c0d1 }
 *       - { in: path, name: playlistId, required: true, schema: { type: string }, description: "MongoDB ObjectId of the playlist", example: 66f1a2b3c4d5e6f7a8b9c0d2 }
 *     responses:
 *       200:
 *         description: Video added to playlist successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route("/add/:videoId/:playlistId").patch(authMiddleware, validate(addRemoveVideoSchema, "params"), addVideoToPlaylist);

/**
 * @swagger
 * /playlists/remove/{videoId}/{playlistId}:
 *   patch:
 *     summary: Remove a video from a playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - { in: path, name: videoId, required: true, schema: { type: string }, description: "MongoDB ObjectId of the video", example: 66f1a2b3c4d5e6f7a8b9c0d1 }
 *       - { in: path, name: playlistId, required: true, schema: { type: string }, description: "MongoDB ObjectId of the playlist", example: 66f1a2b3c4d5e6f7a8b9c0d2 }
 *     responses:
 *       200:
 *         description: Video removed from playlist successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route("/remove/:videoId/:playlistId").patch(authMiddleware, validate(addRemoveVideoSchema, "params"), removeVideoFromPlaylist);

/**
 * @swagger
 * /playlists/{playlistId}:
 *   delete:
 *     summary: Delete a playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - { in: path, name: playlistId, required: true, schema: { type: string }, description: "MongoDB ObjectId of the playlist", example: 66f1a2b3c4d5e6f7a8b9c0d1 }
 *     responses:
 *       200:
 *         description: Playlist deleted successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route("/:playlistId").delete(authMiddleware, validate(mongoIdParamSchema("playlistId"), "params"), deletePlaylist);

/**
 * @swagger
 * /playlists/{playlistId}:
 *   patch:
 *     summary: Update playlist name or description
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - { in: path, name: playlistId, required: true, schema: { type: string }, description: "MongoDB ObjectId of the playlist", example: 66f1a2b3c4d5e6f7a8b9c0d1 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Renamed playlist" }
 *               description: { type: string, example: "New description" }
 *     responses:
 *       200:
 *         description: Playlist updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route("/:playlistId").patch(authMiddleware, validate(mongoIdParamSchema("playlistId"), "params"), validate(updatePlaylistSchema), updatePlaylist);

export default router;