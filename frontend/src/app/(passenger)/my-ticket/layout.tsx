import Link from "next/link";
import { getUser } from "@/lib/auth/getUser";
import React from "react";

export default async function MyTicketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.06),transparent_32%),linear-gradient(180deg,#f8fffb_0%,#ffffff_44%,#f7fbf6_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.06),transparent_32%),linear-gradient(180deg,#04170e_0%,#03130b_46%,#020704_100%)]">
        <div className="mx-auto max-w-3xl px-4 py-10 lg:px-8">
          <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/40">
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
              Login required
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              You need to log in to view your tickets.
            </p>
            <div className="mt-5 flex gap-3">
              <Link
                href="/"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Go to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.06),transparent_32%),linear-gradient(180deg,#f8fffb_0%,#ffffff_44%,#f7fbf6_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.06),transparent_32%),linear-gradient(180deg,#04170e_0%,#03130b_46%,#020704_100%)]">
      <main>{children}</main>
    </div>
  );
}
