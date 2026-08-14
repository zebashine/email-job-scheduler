import type { ReactNode } from "react";

const ACCENTS = {
  indigo: {
    ring: "ring-indigo-100",
    badge: "bg-gradient-to-br from-indigo-500 to-indigo-600",
    value: "text-indigo-700",
  },
  emerald: {
    ring: "ring-emerald-100",
    badge: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    value: "text-emerald-700",
  },
  rose: {
    ring: "ring-rose-100",
    badge: "bg-gradient-to-br from-rose-500 to-rose-600",
    value: "text-rose-700",
  },
} as const;

const ICONS: Record<string, ReactNode> = {
  Scheduled: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Sent: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
      <path d="M22 2 11 13" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Failed: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "indigo" | "emerald" | "rose";
}) {
  const styles = ACCENTS[accent];

  return (
    <div
      className={`rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm ring-1 ${styles.ring} transition-shadow hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm ${styles.badge}`}>
          {ICONS[label]}
        </span>
      </div>
      <p className={`mt-3 text-3xl font-bold tabular-nums ${styles.value}`}>{value}</p>
    </div>
  );
}
