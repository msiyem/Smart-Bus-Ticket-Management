import Link from "next/link";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { getUser } from "@/lib/auth/getUser";
import React from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata = {
  title: "Admin",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const isAdmin = user?.role === "admin";

  if (!user) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.06),transparent_32%),linear-gradient(180deg,#f8fffb_0%,#ffffff_44%,#f7fbf6_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.06),transparent_32%),linear-gradient(180deg,#04170e_0%,#03130b_46%,#020704_100%)]">
        <div className="mx-auto max-w-3xl px-4 py-10 lg:px-8">
          <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/40">
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
              Login required
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              You need to log in with an admin account to access this section.
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.06),transparent_32%),linear-gradient(180deg,#f8fffb_0%,#ffffff_44%,#f7fbf6_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.06),transparent_32%),linear-gradient(180deg,#04170e_0%,#03130b_46%,#020704_100%)]">
        <div className="mx-auto max-w-3xl px-4 py-10 lg:px-8">
          <div className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/30">
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
              Access denied
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              This admin area is only available to admin users.
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
      <TooltipProvider>
        <SidebarProvider>
          <AdminSidebar />
          <SidebarInset className="bg-transparent">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
              <div className="mb-5 flex items-center justify-between rounded-2xl border border-emerald-200/70 bg-white/80 px-3 py-2 shadow-sm backdrop-blur dark:border-emerald-900/50 dark:bg-emerald-950/40">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="text-foreground hover:bg-emerald-50 dark:hover:bg-emerald-900/30" />
                  <p className="text-sm font-medium text-foreground">
                    Admin Panel
                  </p>
                </div>
                <p className="hidden text-xs text-muted-foreground sm:block">
                  Manage routes, buses, schedules, and users
                </p>
              </div>
              <main>{children}</main>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </div>
  );
}
