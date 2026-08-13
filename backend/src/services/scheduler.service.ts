import { prisma } from "../lib/prisma.js";
import { emailQueue } from "../queues/email.queue.js";

export interface ScheduleEmailInput {
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: Date;
  hourlyLimit?: number;
  delaySeconds?: number;
}

export async function scheduleEmail(input: ScheduleEmailInput) {
  const sender = await prisma.sender.findUnique({ where: { id: input.senderId } });
  if (!sender) {
    throw new Error(`Sender ${input.senderId} not found`);
  }

  const emailJob = await prisma.emailJob.create({
    data: {
      recipient: input.recipient,
      subject: input.subject,
      body: input.body,
      scheduledAt: input.scheduledAt,
      senderId: input.senderId,
      status: "scheduled",
      ...(input.hourlyLimit !== undefined ? { hourlyLimit: input.hourlyLimit } : {}),
      ...(input.delaySeconds !== undefined ? { delaySeconds: input.delaySeconds } : {}),
    },
  });

  const delayMs = Math.max(0, input.scheduledAt.getTime() - Date.now());

  const job = await emailQueue.add(
    "send-email",
    { emailJobId: emailJob.id },
    { delay: delayMs, jobId: emailJob.id },
  );

  return prisma.emailJob.update({
    where: { id: emailJob.id },
    data: { status: "queued", bullJobId: job.id ?? null },
  });
}
