import { Router } from "express";
import mongoose from "mongoose";
import healthCheck from "../controllers/health.controller";

const router = Router();

router.route("/health").get(healthCheck);

export default router; 