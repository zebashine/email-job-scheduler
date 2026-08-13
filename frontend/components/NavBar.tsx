"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/compose", label: "Compose" },
  { href: "/scheduled", label: "Scheduled" },
  { href: "/sent", label: "Sent" },
];

export function NavBar() {
  const pathname = usePathname();
  const { user, loading, loginUrl, logout } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-4">
        <span className="text-sm font-semibold text-slate-900">Email Job Scheduler</span>
        <nav className="flex flex-1 gap-1">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
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
                <img src={user.avatar} alt={user.name} className="h-7 w-7 rounded-full" />
              ) : null}
              <span className="text-sm text-slate-700">{user.name}</span>
              <button
                onClick={logout}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Logout
              </button>
            </div>
          ) : (
            <a
              href={loginUrl}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              Sign in with Google
            </a>
          )
        )}
      </div>
    </header>
  );
}
