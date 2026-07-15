import { redirect } from "next/navigation";
import { Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import { getUser } from "@/lib/auth/getUser";

export default async function ProfilePage() {
  const user = await getUser();

  if (!user) {
    redirect("/");
  }

  const displayName = user.name || user.username || "User";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="bg-emerald-700 px-6 py-10 text-white sm:px-8">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex size-20 items-center justify-center rounded-full bg-white/20 text-2xl font-bold ring-4 ring-white/20">
              {initials}
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-100">
                Account profile
              </p>
              <h1 className="mt-1 text-2xl font-bold">{displayName}</h1>
              <p className="mt-1 capitalize text-emerald-100">
                {user.role} account
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
          <ProfileItem icon={<UserRound />} label="Username" value={user.username || "Not set"} />
          <ProfileItem icon={<Mail />} label="Email" value={user.email || "Not available"} />
          <ProfileItem icon={<Phone />} label="Phone" value={user.phone || "Not set"} />
          <ProfileItem icon={<ShieldCheck />} label="Role" value={user.role} capitalize />
        </div>
      </div>
    </section>
  );
}

function ProfileItem({
  icon,
  label,
  value,
  capitalize = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
      <div className="text-emerald-700 dark:text-emerald-300">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className={`truncate text-sm font-semibold text-slate-900 dark:text-slate-100 ${capitalize ? "capitalize" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
