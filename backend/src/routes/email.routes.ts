import { Router } from "express";
import {
  postScheduleEmail,
  getScheduledEmails,
  getSentEmails,
  getEmailStats,
} from "../controllers/email.controller.js";

export const emailRoutes = Router();

emailRoutes.post("/schedule", postScheduleEmail);
emailRoutes.get("/scheduled", getScheduledEmails);
emailRoutes.get("/sent", getSentEmails);
emailRoutes.get("/stats", getEmailStats);
