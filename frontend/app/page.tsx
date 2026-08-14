"use client";

import { useEffect, useState } from "react";
import { getEmailStats } from "@/lib/api";
import type { EmailStats } from "@/lib/types";
import { StatCard } from "@/components/StatCard";
import { ScheduledVsSentChart } from "@/components/ScheduledVsSentChart";

const POLL_INTERVAL_MS = 5000;

export default function DashboardPage() {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getEmailStats();
        if (!cancelled) {
          setStats(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load stats");
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Live overview of your email scheduling pipeline.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not reach the API at {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"}: {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Scheduled" value={stats?.counts.scheduled ?? 0} accent="indigo" />
        <StatCard label="Sent" value={stats?.counts.sent ?? 0} accent="emerald" />
        <StatCard label="Failed" value={stats?.counts.failed ?? 0} accent="rose" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Scheduled vs. Sent (last 14 days)</h2>
        <ScheduledVsSentChart data={stats?.timeSeries ?? []} />
      </div>
    </div>
  );
}
