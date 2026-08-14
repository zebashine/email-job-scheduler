import type { EmailStatus } from "@/lib/types";

const STYLES: Record<EmailStatus, string> = {
  scheduled: "bg-slate-100 text-slate-700",
  queued: "bg-indigo-100 text-indigo-700",
  processing: "bg-amber-100 text-amber-700",
  sent: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
};

const DOT_STYLES: Record<EmailStatus, string> = {
  scheduled: "bg-slate-400",
  queued: "bg-indigo-500",
  processing: "bg-amber-500",
  sent: "bg-emerald-500",
  failed: "bg-rose-500",
};

export function StatusBadge({ status }: { status: EmailStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STYLES[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_STYLES[status]}`} />
      {status}
    </span>
  );
}
