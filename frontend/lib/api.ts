import type { DefaultSender, EmailJob, EmailStats, ScheduleEmailInput } from "./types";
import { getToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function getScheduledEmails(): Promise<EmailJob[]> {
  return apiFetch<EmailJob[]>("/api/emails/scheduled");
}

export function getSentEmails(): Promise<EmailJob[]> {
  return apiFetch<EmailJob[]>("/api/emails/sent");
}

export function getEmailStats(): Promise<EmailStats> {
  return apiFetch<EmailStats>("/api/emails/stats");
}

export function getDefaultSender(): Promise<DefaultSender> {
  return apiFetch<DefaultSender>("/api/senders/default");
}

export function scheduleEmail(input: ScheduleEmailInput): Promise<EmailJob> {
  return apiFetch<EmailJob>("/api/emails/schedule", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
