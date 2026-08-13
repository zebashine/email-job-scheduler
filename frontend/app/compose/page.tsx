"use client";

import { useEffect, useRef, useState } from "react";
import { getDefaultSender, scheduleEmail } from "@/lib/api";
import { parseRecipientsFromCsv } from "@/lib/csv";

interface RecipientResult {
  recipient: string;
  success: boolean;
  error?: string;
}

export default function ComposePage() {
  const [senderId, setSenderId] = useState<string | null>(null);
  const [senderEmail, setSenderEmail] = useState<string | null>(null);
  const [senderError, setSenderError] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [startTime, setStartTime] = useState("");
  const [delaySeconds, setDelaySeconds] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(100);

  const [recipients, setRecipients] = useState<string[]>([]);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<RecipientResult[] | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    getDefaultSender()
      .then((sender) => {
        setSenderId(sender.id);
        setSenderEmail(sender.email);
      })
      .catch((err) => {
        setSenderError(err instanceof Error ? err.message : "Failed to load sender");
      });
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setRecipients([]);
      setCsvFileName(null);
      return;
    }
    setCsvError(null);
    const text = await file.text();
    const parsed = parseRecipientsFromCsv(text);
    if (parsed.length === 0) {
      setCsvError("No valid email addresses found in that file.");
    }
    setRecipients(parsed);
    setCsvFileName(file.name);
  }

  function resetForm() {
    setSubject("");
    setBody("");
    setStartTime("");
    setDelaySeconds(2);
    setHourlyLimit(100);
    setRecipients([]);
    setCsvFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setResults(null);

    if (!senderId) {
      setFormError("No sender is available yet. Try again in a moment.");
      return;
    }
    if (!subject.trim() || !body.trim()) {
      setFormError("Subject and body are required.");
      return;
    }
    if (recipients.length === 0) {
      setFormError("Upload a CSV with at least one recipient email.");
      return;
    }
    if (!startTime) {
      setFormError("Start time is required.");
      return;
    }
    const startMs = new Date(startTime).getTime();
    if (Number.isNaN(startMs)) {
      setFormError("Start time is invalid.");
      return;
    }

    setSubmitting(true);
    setProgress({ done: 0, total: recipients.length });

    const batchResults: RecipientResult[] = [];
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i]!;
      const scheduledAt = new Date(startMs + i * delaySeconds * 1000).toISOString();
      try {
        await scheduleEmail({
          senderId,
          recipient,
          subject,
          body,
          scheduledAt,
          hourlyLimit,
          delaySeconds,
        });
        batchResults.push({ recipient, success: true });
      } catch (err) {
        batchResults.push({
          recipient,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
      setProgress({ done: i + 1, total: recipients.length });
    }

    setResults(batchResults);
    setSubmitting(false);
    if (batchResults.every((r) => r.success)) {
      resetForm();
    }
  }

  const successCount = results?.filter((r) => r.success).length ?? 0;
  const failureCount = results ? results.length - successCount : 0;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Compose New Email</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload a CSV of recipients and schedule a staggered send.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        Sending from:{" "}
        {senderError ? (
          <span className="text-red-600">{senderError}</span>
        ) : senderEmail ? (
          <span className="font-medium text-slate-900">{senderEmail}</span>
        ) : (
          <span className="text-slate-400">loading…</span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="subject">
            Subject
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            placeholder="Your weekly update"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="body">
            Body
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            placeholder="Write the email content here…"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="csv">
            Recipients (CSV)
          </label>
          <input
            id="csv"
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="mt-1 w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
          />
          {csvError && <p className="mt-1 text-xs text-red-600">{csvError}</p>}
          {csvFileName && recipients.length > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              {csvFileName}: {recipients.length} recipient{recipients.length === 1 ? "" : "s"} loaded
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="startTime">
              Start time
            </label>
            <input
              id="startTime"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="delaySeconds">
              Delay between emails (s)
            </label>
            <input
              id="delaySeconds"
              type="number"
              min={0}
              value={delaySeconds}
              onChange={(e) => setDelaySeconds(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="hourlyLimit">
              Hourly limit (per sender)
            </label>
            <input
              id="hourlyLimit"
              type="number"
              min={1}
              value={hourlyLimit}
              onChange={(e) => setHourlyLimit(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </div>
        )}

        {submitting && (
          <div className="text-sm text-slate-600">
            Scheduling {progress.done} of {progress.total}…
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !senderId}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Scheduling…" : `Schedule ${recipients.length || ""} Email${recipients.length === 1 ? "" : "s"}`}
        </button>
      </form>

      {results && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-900">
            {successCount} scheduled successfully{failureCount > 0 ? `, ${failureCount} failed` : ""}
          </p>
          {failureCount > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-red-600">
              {results
                .filter((r) => !r.success)
                .map((r) => (
                  <li key={r.recipient}>
                    {r.recipient}: {r.error}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
