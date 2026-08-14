import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import { AuthProvider } from "@/components/AuthProvider";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Email Job Scheduler",
  description: "Schedule, rate-limit, and send bulk emails through Ethereal test SMTP.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-50/50">
        <AuthProvider>
          <ToastProvider>
            <NavBar />
            <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
