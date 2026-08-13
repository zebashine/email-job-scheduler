// Standalone end-to-end verification script. Exercises the real HTTP API
// (not the services directly), so it proves the server, DB, Redis, BullMQ
// worker, and SMTP service are all wired together correctly.
//
// Prerequisites (run in separate terminals first):
//   npm run dev     -- starts the Express API
//   npm run worker  -- starts the BullMQ worker that actually sends the email
//
// Usage:
//   npx tsx src/scripts/testSchedule.ts
import "dotenv/config";
import { prisma } from "../lib/prisma.js";
import { createEtherealSender } from "../services/smtp.service.js";

const BASE_URL = `http://localhost:${process.env["PORT"] ?? 5000}`;
const SCHEDULE_DELAY_MS = 5_000;
const POLL_INTERVAL_MS = 1_000;
const POLL_TIMEOUT_MS = 60_000;

async function ensureServerIsUp() {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`unexpected status ${res.status}`);
  } catch {
    console.error(
      `Could not reach ${BASE_URL}/health. Is the server running? Start it with: npm run dev`,
    );
    process.exit(1);
  }
}

async function ensureTestSender() {
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
  console.log(`Created test sender ${sender.id} (${sender.email}) via Ethereal Email`);
  return sender;
}

async function main() {
  await ensureServerIsUp();
  const sender = await ensureTestSender();

  const scheduledAt = new Date(Date.now() + SCHEDULE_DELAY_MS).toISOString();
  console.log(`\nPOST ${BASE_URL}/api/emails/schedule`);
  const res = await fetch(`${BASE_URL}/api/emails/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      senderId: sender.id,
      recipient: "recipient@example.com",
      subject: "End-to-end test email",
      body: "If you can see this, the scheduler pipeline works end to end.",
      scheduledAt,
    }),
  });

  if (!res.ok) {
    console.error(`Schedule request failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }

  const emailJob = await res.json();
  console.log("Scheduled EmailJob:", emailJob);
  console.log(`\nWaiting for the worker to process it (scheduled for ${scheduledAt})...`);
  console.log("(make sure `npm run worker` is running in another terminal)\n");

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let lastStatus: string | null = null;

  while (Date.now() < deadline) {
    const current = await prisma.emailJob.findUnique({ where: { id: emailJob.id } });
    if (!current) {
      console.error("EmailJob disappeared unexpectedly");
      process.exit(1);
    }
    if (current.status !== lastStatus) {
      console.log(`status: ${current.status}`);
      lastStatus = current.status;
    }
    if (current.status === "sent") {
      console.log(`\nSuccess. Sent at ${current.sentAt?.toISOString()}.`);
      console.log("Check the worker's terminal output for the Ethereal preview URL.");
      process.exit(0);
    }
    if (current.status === "failed") {
      console.error("\nEmailJob ended up in 'failed' status. Check the worker logs.");
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  console.error(
    `\nTimed out after ${POLL_TIMEOUT_MS}ms waiting for status 'sent'. Last status: ${lastStatus}. Is \`npm run worker\` running?`,
  );
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
