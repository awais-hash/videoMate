import { Router } from "express";
import { healthCheck } from "../controllers/health.controller.js";

const router = Router();

/**
 * @swagger
 * /health:
 * get:
 * summary: Check server health
 * tags: [Health]
 * responses:
 * 200:
 * description: Server is running successfully
 * 404:
 * description: Route not found
 */
router.route("/").get(healthCheck);

export default router;