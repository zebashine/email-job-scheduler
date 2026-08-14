import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { scheduleEmail } from "../services/scheduler.service.js";

const IN_PROGRESS_STATUSES = ["scheduled", "queued", "processing"];

export async function postScheduleEmail(req: Request, res: Response) {
  const { senderId, recipient, subject, body, scheduledAt, hourlyLimit, delaySeconds } = req.body ?? {};

  if (!senderId || !recipient || !subject || !body || !scheduledAt) {
    res.status(400).json({
      error: "senderId, recipient, subject, body, and scheduledAt are required",
    });
    return;
  }

  const scheduledAtDate = new Date(scheduledAt);
  if (Number.isNaN(scheduledAtDate.getTime())) {
    res.status(400).json({ error: "scheduledAt must be a valid date/time string" });
    return;
  }

  try {
    const emailJob = await scheduleEmail({
      senderId,
      recipient,
      subject,
      body,
      scheduledAt: scheduledAtDate,
      ...(hourlyLimit !== undefined ? { hourlyLimit } : {}),
      ...(delaySeconds !== undefined ? { delaySeconds } : {}),
    });
    res.status(201).json(emailJob);
  } catch (err) {
    if (err instanceof Error && err.message.includes("not found")) {
      res.status(404).json({ error: err.message });
      return;
    }
    throw err;
  }
}

export async function getScheduledEmails(_req: Request, res: Response) {
  const emails = await prisma.emailJob.findMany({
    where: { status: { in: IN_PROGRESS_STATUSES } },
    orderBy: { scheduledAt: "asc" },
  });
  res.json(emails);
}

export async function getEmailById(req: Request, res: Response) {
  const email = await prisma.emailJob.findUnique({ where: { id: req.params["id"] } });
  if (!email) {
    res.status(404).json({ error: "EmailJob not found" });
    return;
  }
  res.json(email);
}

export async function getSentEmails(_req: Request, res: Response) {
  const emails = await prisma.emailJob.findMany({
    where: { status: "sent" },
    orderBy: { sentAt: "desc" },
  });
  res.json(emails);
}

interface DayCount {
  date: string;
  count: number;
}

export async function getEmailStats(_req: Request, res: Response) {
  const [scheduled, sent, failed] = await Promise.all([
    prisma.emailJob.count({ where: { status: { in: IN_PROGRESS_STATUSES } } }),
    prisma.emailJob.count({ where: { status: "sent" } }),
    prisma.emailJob.count({ where: { status: "failed" } }),
  ]);

  const [scheduledByDay, sentByDay] = await Promise.all([
    prisma.$queryRaw<DayCount[]>`
      SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') as date, COUNT(*)::int as count
      FROM "EmailJob"
      WHERE "createdAt" >= NOW() - INTERVAL '14 days'
      GROUP BY 1
      ORDER BY 1
    `,
    prisma.$queryRaw<DayCount[]>`
      SELECT to_char(date_trunc('day', "sentAt"), 'YYYY-MM-DD') as date, COUNT(*)::int as count
      FROM "EmailJob"
      WHERE "sentAt" >= NOW() - INTERVAL '14 days'
      GROUP BY 1
      ORDER BY 1
    `,
  ]);

  const byDate = new Map<string, { date: string; scheduled: number; sent: number }>();
  for (const row of scheduledByDay) {
    byDate.set(row.date, { date: row.date, scheduled: row.count, sent: 0 });
  }
  for (const row of sentByDay) {
    const existing = byDate.get(row.date);
    if (existing) {
      existing.sent = row.count;
    } else {
      byDate.set(row.date, { date: row.date, scheduled: 0, sent: row.count });
    }
  }

  const timeSeries = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));

  res.json({ counts: { scheduled, sent, failed }, timeSeries });
}
