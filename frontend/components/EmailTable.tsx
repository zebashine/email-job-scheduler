import type { EmailJob } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export function EmailTable({
  rows,
  dateColumn,
  emptyMessage,
}: {
  rows: EmailJob[];
  dateColumn: "scheduledAt" | "sentAt";
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-indigo-200 bg-white/60 p-10 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-gradient-to-r from-indigo-50 to-violet-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Email</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Subject</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">
              {dateColumn === "scheduledAt" ? "Scheduled Time" : "Sent Time"}
            </th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-indigo-50/40">
              <td className="px-4 py-3 text-slate-900">{row.recipient}</td>
              <td className="px-4 py-3 text-slate-700">{row.subject}</td>
              <td className="px-4 py-3 text-slate-700">{formatDate(row[dateColumn])}</td>
              <td className="px-4 py-3">
                <StatusBadge status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
