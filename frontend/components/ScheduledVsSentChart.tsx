"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EmailStatsTimeSeriesPoint } from "@/lib/types";

export function ScheduledVsSentChart({ data }: { data: EmailStatsTimeSeriesPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
        No activity in the last 14 days yet.
      </div>
    );
  }

  return (
    <div className="h-72 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
          <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0" }} />
          <Legend />
          <Line type="monotone" dataKey="scheduled" name="Scheduled" stroke="#6366f1" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="sent" name="Sent" stroke="#10b981" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
