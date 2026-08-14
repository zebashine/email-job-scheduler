"use client";

import { useEffect, useState } from "react";
import { createSender, getSenders } from "@/lib/api";
import type { Sender } from "@/lib/types";
import { useToast } from "@/components/Toast";

export default function SendersPage() {
  const { showToast } = useToast();
  const [senders, setSenders] = useState<Sender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showManualForm, setShowManualForm] = useState(false);
  const [creatingEthereal, setCreatingEthereal] = useState(false);
  const [creatingManual, setCreatingManual] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function refresh() {
    try {
      const data = await getSenders();
      setSenders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load senders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleAddEthereal() {
    setCreatingEthereal(true);
    setFormError(null);
    try {
      const sender = await createSender({ mode: "ethereal" });
      await refresh();
      showToast(`Test inbox ${sender.email} created.`, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create test sender";
      setFormError(message);
      showToast(message, "error");
    } finally {
      setCreatingEthereal(false);
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !smtpHost.trim() || !username.trim() || !password.trim()) {
      setFormError("All fields are required.");
      return;
    }

    setCreatingManual(true);
    try {
      await createSender({ mode: "manual", email, smtpHost, smtpPort, username, password });
      setEmail("");
      setSmtpHost("");
      setSmtpPort(587);
      setUsername("");
      setPassword("");
      setShowManualForm(false);
      await refresh();
      showToast("Sender added successfully.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add sender";
      setFormError(message);
      showToast(message, "error");
    } finally {
      setCreatingManual(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Senders</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage the mailboxes emails can be scheduled from. Add a real SMTP account, or spin up a free
          Ethereal test inbox for demos.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-700">Existing senders</h2>
        </div>
        {loading ? (
          <p className="px-5 py-6 text-sm text-slate-400">Loading…</p>
        ) : senders.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400">No senders yet — add one below.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {senders.map((sender) => (
              <li key={sender.id} className="flex items-center gap-3 px-5 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white">
                  {sender.email.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-900">{sender.email}</p>
                  <p className="text-xs text-slate-400">
                    {sender.smtpHost}:{sender.smtpPort}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Add a sender</h2>

        {formError && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {formError}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleAddEthereal}
            disabled={creatingEthereal}
            className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creatingEthereal ? "Creating…" : "+ Generate Ethereal test inbox"}
          </button>
          <button
            onClick={() => setShowManualForm((v) => !v)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {showManualForm ? "Cancel" : "+ Add real SMTP account"}
          </button>
        </div>

        {showManualForm && (
          <form onSubmit={handleManualSubmit} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="you@yourdomain.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">SMTP host</label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="smtp.gmail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">SMTP port</label>
              <input
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Password / app password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={creatingManual}
                className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingManual ? "Adding…" : "Add sender"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
