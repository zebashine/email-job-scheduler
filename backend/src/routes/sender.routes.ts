import { Router } from "express";
import { getDefaultSender } from "../controllers/sender.controller.js";

export const senderRoutes = Router();

senderRoutes.get("/default", getDefaultSender);
