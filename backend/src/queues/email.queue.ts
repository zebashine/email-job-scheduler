import { Queue } from "bullmq";
import { redis } from "../lib/redis.js";

export const EMAIL_QUEUE_NAME = "email-send";

export interface EmailJobPayload {
  emailJobId: string;
}

export const emailQueue = new Queue<EmailJobPayload>(EMAIL_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 1000,
    removeOnFail: 1000,
  },
});
