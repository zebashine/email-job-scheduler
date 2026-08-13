"use client";

import { useEffect, useState } from "react";
import { getScheduledEmails } from "@/lib/api";
import type { EmailJob } from "@/lib/types";
import { EmailTable } from "@/components/EmailTable";

const POLL_INTERVAL_MS = 5000;

export default function ScheduledPage() {
  const [rows, setRows] = useState<EmailJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getScheduledEmails();
        if (!cancelled) {
          setRows(data);
          setLastUpdated(new Date());
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load scheduled emails");
        }
      }
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Scheduled Emails</h1>
          <p className="mt-1 text-sm text-slate-500">
            Jobs that are scheduled, queued, or currently being sent.
          </p>
        </div>
        {lastUpdated && (
          <p className="text-xs text-slate-400">Updated {lastUpdated.toLocaleTimeString()}</p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <EmailTable rows={rows} dateColumn="scheduledAt" emptyMessage="No scheduled emails yet." />
    </div>
  );
}
