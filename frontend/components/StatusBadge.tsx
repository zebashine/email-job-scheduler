import type { EmailStatus } from "@/lib/types";

const STYLES: Record<EmailStatus, string> = {
  scheduled: "bg-slate-100 text-slate-700",
  queued: "bg-blue-100 text-blue-700",
  processing: "bg-amber-100 text-amber-700",
  sent: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: EmailStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
