"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/compose", label: "Compose" },
  { href: "/scheduled", label: "Scheduled" },
  { href: "/sent", label: "Sent" },
  { href: "/senders", label: "Senders" },
];

export function NavBar() {
  const pathname = usePathname();
  const { user, loading, loginUrl, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white shadow-sm shadow-indigo-200">
            E
          </span>
          <span className="text-sm font-semibold tracking-tight text-slate-900">Email Job Scheduler</span>
        </div>
        <nav className="flex flex-1 gap-1">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-200"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {!loading && (
          user ? (
            <div className="flex items-center gap-3">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-7 w-7 rounded-full ring-2 ring-indigo-100"
                />
              ) : null}
              <span className="text-sm font-medium text-slate-700">{user.name}</span>
              <button
                onClick={logout}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
              >
                Logout
              </button>
            </div>
          ) : (
            <a
              href={loginUrl}
              className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-opacity hover:opacity-90"
            >
              Sign in with Google
            </a>
          )
        )}
      </div>
    </header>
  );
}
