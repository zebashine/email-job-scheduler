import { Worker, DelayedError, type Job } from "bullmq";
import { redis } from "../lib/redis.js";
import { prisma } from "../lib/prisma.js";
import { EMAIL_QUEUE_NAME, type EmailJobPayload } from "../queues/email.queue.js";
import { checkAndConsume, getMsUntilNextHour } from "../services/rateLimit.service.js";
import { sendEmail } from "../services/smtp.service.js";

async function processEmailJob(job: Job<EmailJobPayload>, token?: string) {
  const emailJob = await prisma.emailJob.findUnique({
    where: { id: job.data.emailJobId },
    include: { sender: true },
  });

  if (!emailJob) {
    console.warn(`EmailJob ${job.data.emailJobId} not found, skipping`);
    return;
  }

  if (emailJob.status === "sent") {
    return;
  }

  const rateLimit = await checkAndConsume(emailJob.senderId, emailJob.hourlyLimit);

  if (!rateLimit.allowed) {
    const delayMs = getMsUntilNextHour();
    console.log(`Rate limit hit for sender ${emailJob.senderId}, delaying job ${job.id} by ${delayMs}ms`);
    await prisma.emailJob.update({
      where: { id: emailJob.id },
      data: { status: "queued" },
    });
    await job.moveToDelayed(Date.now() + delayMs, token);
    throw new DelayedError();
  }

  await prisma.emailJob.update({
    where: { id: emailJob.id },
    data: { status: "processing" },
  });

  try {
    const result = await sendEmail(emailJob.sender, {
      from: emailJob.sender.email,
      to: emailJob.recipient,
      subject: emailJob.subject,
      text: emailJob.body,
    });

    await prisma.emailJob.update({
      where: { id: emailJob.id },
      data: { status: "sent", sentAt: new Date() },
    });

    console.log(`Sent EmailJob ${emailJob.id} -> ${result.previewUrl}`);
  } catch (err) {
    await prisma.emailJob.update({
      where: { id: emailJob.id },
      data: { retryCount: { increment: 1 } },
    });
    throw err;
  }
}

const WORKER_CONCURRENCY = Number(process.env["WORKER_CONCURRENCY"] ?? 5);

export const emailWorker = new Worker<EmailJobPayload>(EMAIL_QUEUE_NAME, processEmailJob, {
  connection: redis,
  concurrency: WORKER_CONCURRENCY,
});

emailWorker.on("failed", (job, err) => {
  if (!job) return;
  const attemptsMade = job.attemptsMade;
  const maxAttempts = job.opts.attempts ?? 1;
  console.error(`EmailJob ${job.data.emailJobId} attempt ${attemptsMade}/${maxAttempts} failed: ${err.message}`);
  if (attemptsMade >= maxAttempts) {
    prisma.emailJob
      .update({ where: { id: job.data.emailJobId }, data: { status: "failed" } })
      .catch((updateErr) => console.error("Failed to mark EmailJob as failed:", updateErr));
  }
});
