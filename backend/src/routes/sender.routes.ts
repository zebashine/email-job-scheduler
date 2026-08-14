import { Router } from "express";
import { getDefaultSender, listSenders, createSender } from "../controllers/sender.controller.js";

export const senderRoutes = Router();

senderRoutes.get("/default", getDefaultSender);
senderRoutes.get("/", listSenders);
senderRoutes.post("/", createSender);
