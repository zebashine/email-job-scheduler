import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { createEtherealSender } from "../services/smtp.service.js";

// With Google OAuth not wired up yet, there's no per-user connected mailbox
// to schedule from. This returns a single shared Sender backed by a real
// Ethereal Email test inbox, creating it on first use so the frontend has a
// senderId to schedule against without any manual setup.
export async function getDefaultSender(_req: Request, res: Response) {
  const existing = await prisma.sender.findFirst();
  if (existing) {
    res.json({ id: existing.id, email: existing.email });
    return;
  }

  const creds = await createEtherealSender();
  const sender = await prisma.sender.create({
    data: {
      email: creds.email,
      smtpHost: creds.smtpHost,
      smtpPort: creds.smtpPort,
      username: creds.username,
      password: creds.password,
    },
  });
  res.status(201).json({ id: sender.id, email: sender.email });
}
