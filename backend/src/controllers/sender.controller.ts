import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { createEtherealSender } from "../services/smtp.service.js";

// Never send SMTP passwords back to the frontend.
function toPublicSender(sender: { id: string; email: string; smtpHost: string; smtpPort: number }) {
  return { id: sender.id, email: sender.email, smtpHost: sender.smtpHost, smtpPort: sender.smtpPort };
}

// With Google OAuth not wired up yet, there's no per-user connected mailbox
// to schedule from. This returns a single shared Sender backed by a real
// Ethereal Email test inbox, creating it on first use so the frontend has a
// senderId to schedule against without any manual setup.
export async function getDefaultSender(_req: Request, res: Response) {
  const existing = await prisma.sender.findFirst();
  if (existing) {
    res.json(toPublicSender(existing));
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
  res.status(201).json(toPublicSender(sender));
}

// Lists every sender that can be selected as the "from" account when
// composing — this is what makes multi-sender support real rather than
// hardcoded to a single default.
export async function listSenders(_req: Request, res: Response) {
  const senders = await prisma.sender.findMany({ orderBy: { email: "asc" } });
  res.json(senders.map(toPublicSender));
}

// Adds a new sender. Two modes:
//   { mode: "ethereal" }                                — auto-provisions a fresh Ethereal test inbox
//   { mode: "manual", email, smtpHost, smtpPort, username, password } — real SMTP credentials
export async function createSender(req: Request, res: Response) {
  const { mode } = req.body ?? {};

  if (mode === "ethereal") {
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
    res.status(201).json(toPublicSender(sender));
    return;
  }

  const { email, smtpHost, smtpPort, username, password } = req.body ?? {};
  if (!email || !smtpHost || !smtpPort || !username || !password) {
    res.status(400).json({
      error: "email, smtpHost, smtpPort, username, and password are required for a manual sender",
    });
    return;
  }

  const sender = await prisma.sender.create({
    data: { email, smtpHost, smtpPort: Number(smtpPort), username, password },
  });
  res.status(201).json(toPublicSender(sender));
}
