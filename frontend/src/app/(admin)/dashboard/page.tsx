import Link from "next/link";
import React from "react";
import {
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/admin-page-primitives";

export default function AdminIndex() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Admin Dashboard"
        description="Quick access to all administrative features."
      />

      <AdminPanel
        title="Quick Links"
        description="Jump directly into your most-used management screens."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/routes"
            className="rounded-2xl border border-emerald-200/80 bg-white/90 p-4 text-base font-medium text-foreground transition hover:-translate-y-0.5 hover:shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/40"
          >
            Manage Routes
          </Link>
          <Link
            href="/buses"
            className="rounded-2xl border border-emerald-200/80 bg-white/90 p-4 text-base font-medium text-foreground transition hover:-translate-y-0.5 hover:shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/40"
          >
            Manage Buses
          </Link>
          <Link
            href="/schedules"
            className="rounded-2xl border border-emerald-200/80 bg-white/90 p-4 text-base font-medium text-foreground transition hover:-translate-y-0.5 hover:shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/40"
          >
            Manage Schedules
          </Link>
          <Link
            href="/trips"
            className="rounded-2xl border border-emerald-200/80 bg-white/90 p-4 text-base font-medium text-foreground transition hover:-translate-y-0.5 hover:shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/40"
          >
            Manage Trips
          </Link>
        </div>
      </AdminPanel>
    </div>
  );
}
