import { AuthButton } from "@/components/ui";
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { AuthProvider } from "./providers/AuthProvider";
import { ReduxProvider } from "./providers/ReduxProvider";
import { SessionSync } from "./providers/SessionSync";

export const metadata: Metadata = {
  title: "Job Application Tracker",
  description: "Track your job applications and notes in one place",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <AuthProvider>
          <ReduxProvider>
            <SessionSync />
            <div className="min-h-screen flex flex-col">
              <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
                  <Link href="/" className="text-lg font-semibold text-slate-900">
                    Job Tracker
                  </Link>
                  <nav className="flex items-center gap-4">
                    <Link
                      href="/"
                      className="text-sm font-medium text-slate-600 hover:text-slate-900"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/jobs"
                      className="text-sm font-medium text-slate-600 hover:text-slate-900"
                    >
                      Applications
                    </Link>
                    <Link
                      href="/jobs/new"
                      className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
                    >
                      Add job
                    </Link>
                    <AuthButton />
                  </nav>
                </div>
              </header>
              <main className="flex-1 px-4 py-8 sm:px-6">{children}</main>
              <footer className="border-t border-slate-200 py-4 text-center text-sm text-slate-500">
                Job Application Tracking System
              </footer>
            </div>
          </ReduxProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
