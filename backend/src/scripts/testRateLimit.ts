// Demo/proof script for the rate limiting + "no drops" requirement.
// Creates a test sender with hourlyLimit = 3, then fires 6 scheduling
// requests back-to-back (all scheduled "now"). Expect: 3 get sent almost
// immediately, the other 3 get accepted (not dropped) and sit in
// "queued" status, rescheduled to the next hour window by the worker.
//
// Prerequisites (separate terminals):
//   npm run dev
//   npm run worker
//
// Usage:
//   npx tsx src/scripts/testRateLimit.ts
import "dotenv/config";
import { prisma } from "../lib/prisma.js";
import { createEtherealSender } from "../services/smtp.service.js";

const BASE_URL = `http://localhost:${process.env["PORT"] ?? 5000}`;
const HOURLY_LIMIT = 3;
const BATCH_SIZE = 6;

async function main() {
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
  console.log(`Created rate-limit test sender ${sender.id} (${sender.email})`);
  console.log(`Hourly limit for this run: ${HOURLY_LIMIT}. Sending ${BATCH_SIZE} requests at once.\n`);

  const scheduledAt = new Date(Date.now() + 1000).toISOString();
  const jobIds: string[] = [];

  for (let i = 0; i < BATCH_SIZE; i++) {
    const res = await fetch(`${BASE_URL}/api/emails/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: sender.id,
        recipient: `load-test-${i}@example.com`,
        subject: `Rate limit test #${i}`,
        body: "Proving rate limiting rejects nothing, just delays it.",
        scheduledAt,
        hourlyLimit: HOURLY_LIMIT,
      }),
    });
    const job = await res.json();
    jobIds.push(job.id);
    console.log(`Scheduled job ${i}: ${job.id}`);
  }

  console.log("\nWaiting 10s for the worker to process the batch...\n");
  await new Promise((r) => setTimeout(r, 10_000));

  const jobs = await prisma.emailJob.findMany({ where: { id: { in: jobIds } } });
  const sent = jobs.filter((j) => j.status === "sent");
  const queuedOrDelayed = jobs.filter((j) => j.status !== "sent" && j.status !== "failed");
  const failed = jobs.filter((j) => j.status === "failed");

  console.log(`Result: ${sent.length} sent immediately, ${queuedOrDelayed.length} rescheduled (not dropped), ${failed.length} failed.`);
  console.log(`Total accounted for: ${jobs.length} / ${BATCH_SIZE} (should match exactly — proves nothing was lost).`);

  if (jobs.length === BATCH_SIZE && sent.length === HOURLY_LIMIT && failed.length === 0) {
    console.log("\nPASS: exactly the hourly limit sent, the rest rescheduled with zero drops.");
  } else {
    console.log("\nCheck the numbers above against expectations manually.");
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
