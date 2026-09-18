import { Router } from "express";
import mongoose from "mongoose";
import healthCheck from "../controllers/health.controller.js";

const router = Router();

router.route("/").get(healthCheck);

export default router; 