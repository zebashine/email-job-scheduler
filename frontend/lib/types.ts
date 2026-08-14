export type EmailStatus = "scheduled" | "queued" | "processing" | "sent" | "failed";

export interface EmailJob {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt: string | null;
  status: EmailStatus;
  senderId: string;
  delaySeconds: number;
  hourlyLimit: number;
  bullJobId: string | null;
  retryCount: number;
  createdAt: string;
}

export interface EmailStatsTimeSeriesPoint {
  date: string;
  scheduled: number;
  sent: number;
}

export interface EmailStats {
  counts: {
    scheduled: number;
    sent: number;
    failed: number;
  };
  timeSeries: EmailStatsTimeSeriesPoint[];
}

export interface DefaultSender {
  id: string;
  email: string;
}

export interface Sender {
  id: string;
  email: string;
  smtpHost: string;
  smtpPort: number;
}

export type CreateSenderInput =
  | { mode: "ethereal" }
  | {
      mode: "manual";
      email: string;
      smtpHost: string;
      smtpPort: number;
      username: string;
      password: string;
    };

export interface ScheduleEmailInput {
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  hourlyLimit?: number;
  delaySeconds?: number;
}
