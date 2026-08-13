import { Router } from "express";
import { googleLogin, googleCallback, getCurrentUser } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const authRoutes = Router();

authRoutes.get("/google", googleLogin);
authRoutes.get("/google/callback", googleCallback);
authRoutes.get("/me", requireAuth, getCurrentUser);
