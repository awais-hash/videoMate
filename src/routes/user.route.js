import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updatePassword,
  updateUserDetails,
  getCurrentUser,
  updateAvatar,
  updateCoverImage,
  channelProfile,
  getWatchHistory,
  clearWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authLimiter, uploadLimiter } from "../middlewares/rateLimit.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  updatePasswordSchema,
  updateUserDetailsSchema,
  channelProfileParamsSchema,
} from "../validators/user.validator.schema.js";

const router = Router();

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [fullName, email, userName, password, avatar]
 *             properties:
 *               fullName: { type: string, example: "Ahmad Khan" }
 *               email: { type: string, format: email, example: "ahmad@example.com" }
 *               userName: { type: string, example: "ahmad123" }
 *               password: { type: string, format: password, example: "Secret@123" }
 *               avatar: { type: string, format: binary }
 *               coverImage: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: User with this email or username already exists
 *       429:
 *         description: Too many requests (rate limit)
 */
router.route("/register").post(
    authLimiter,
    uploadLimiter,
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    validate(registerSchema),
    registerUser
);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Login a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               email: { type: string, format: email, example: "ahmad@example.com" }
 *               userName: { type: string, example: "ahmad123" }
 *               password: { type: string, format: password, example: "Secret@123" }
 *     responses:
 *       200:
 *         description: Logged in successfully (access and refresh tokens are returned)
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many requests (rate limit)
 */
router.route("/login").post(authLimiter, validate(loginSchema), loginUser);

/**
 * @swagger
 * /users/logout:
 *   post:
 *     summary: Logout the current user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route("/logout").post(authMiddleware, logoutUser);

/**
 * @swagger
 * /users/refresh-access-token:
 *   post:
 *     summary: Get a new access token using the refresh token
 *     tags: [Users]
 *     requestBody:
 *       description: Refresh token (cookie mein bhi ho sakta hai)
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *       401:
 *         description: Refresh token missing, expired or invalid
 *       429:
 *         description: Too many requests (rate limit)
 */
router.route("/refresh-access-token").post(authLimiter, refreshAccessToken);

/**
 * @swagger
 * /users/update-password:
 *   post:
 *     summary: Change the current user's password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword: { type: string, format: password }
 *               newPassword: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         description: Too many requests (rate limit)
 */
router.route("/update-password").post(authLimiter, authMiddleware, validate(updatePasswordSchema), updatePassword);

/**
 * @swagger
 * /users/update-details:
 *   post:
 *     summary: Update the current user's account details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string, example: "Ahmad Khan" }
 *               email: { type: string, format: email, example: "ahmad@example.com" }
 *     responses:
 *       200:
 *         description: Account details updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route("/update-details").post(authMiddleware, validate(updateUserDetailsSchema), updateUserDetails);

/**
 * @swagger
 * /users/current-user:
 *   get:
 *     summary: Get the currently logged-in user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user fetched successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route("/current-user").get(authMiddleware, getCurrentUser);

// router.route("/delete-account").delete(authMiddleware, deleteAccount);

/**
 * @swagger
 * /users/update-avatar:
 *   patch:
 *     summary: Update the user's avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 *       400:
 *         description: Avatar file is missing
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         description: Too many requests (rate limit)
 */
router.route("/update-avatar").patch(uploadLimiter, authMiddleware, upload.single("avatar"), updateAvatar);

/**
 * @swagger
 * /users/update-cover-image:
 *   patch:
 *     summary: Update the user's cover image
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [coverImage]
 *             properties:
 *               coverImage: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Cover image updated successfully
 *       400:
 *         description: Cover image file is missing
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         description: Too many requests (rate limit)
 */
router.route("/update-cover-image").patch(uploadLimiter, authMiddleware, upload.single("coverImage"), updateCoverImage);

/**
 * @swagger
 * /users/c/{userName}:
 *   get:
 *     summary: Get a channel profile by username
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - { in: path, name: userName, required: true, schema: { type: string }, description: "Username of the channel", example: ahmad123 }
 *     responses:
 *       200:
 *         description: Channel profile fetched successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route("/c/:userName").get(authMiddleware, validate(channelProfileParamsSchema, "params"), channelProfile);

/**
 * @swagger
 * /users/history:
 *   get:
 *     summary: Get the current user's watch history
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Watch history fetched successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route("/history").get(authMiddleware, getWatchHistory);

/**
 * @swagger
 * /users/history-clear:
 *   patch:
 *     summary: Clear the current user's watch history
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Watch history cleared successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route("/history-clear").patch(authMiddleware, clearWatchHistory);

export default router;