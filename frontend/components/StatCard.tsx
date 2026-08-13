export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "slate" | "emerald" | "red";
}) {
  const accentClasses = {
    slate: "text-slate-900",
    emerald: "text-emerald-600",
    red: "text-red-600",
  }[accent];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tabular-nums ${accentClasses}`}>{value}</p>
    </div>
  );
}
