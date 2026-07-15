"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { KeyRound, LoaderCircle, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clientUpdateAccount } from "@/lib/auth/client";
import { useUserStore } from "@/store/userStore";

export default function SettingsClient({ initialName }: { initialName: string }) {
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);
  const storedUser = useUserStore((state) => state.user);
  const [name, setName] = useState(initialName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      toast.error("Name must be at least 2 characters.");
      return;
    }
    if (newPassword || currentPassword || confirmPassword) {
      if (!currentPassword || !newPassword) {
        toast.error("Enter your current password and a new password.");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("New passwords do not match.");
        return;
      }
    }

    setSaving(true);
    const result = await clientUpdateAccount({
      name: trimmedName,
      ...(newPassword ? { currentPassword, newPassword } : {}),
    });
    setSaving(false);

    if (!result.success || !result.user) {
      toast.error(result.message || "Unable to save settings.");
      return;
    }

    setUser({
      id: Number(result.user.id),
      name: result.user.name ?? null,
      username: result.user.username ?? null,
      email: result.user.email,
      role: result.user.role,
      profile_image: storedUser?.profile_image ?? null,
    });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success(result.message || "Account settings updated.");
    router.refresh();
  };

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-8">
        <div>
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Account settings
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-slate-100">
            Update your profile
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Change your display name or password. Password updates require your current password.
          </p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <UserRound className="size-4 text-emerald-700 dark:text-emerald-300" />
              <Label htmlFor="name">Display name</Label>
            </div>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-4 border-t border-slate-200 pt-8 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-emerald-700 dark:text-emerald-300" />
              <h2 className="font-semibold text-slate-950 dark:text-slate-100">Change password</h2>
            </div>
            <Input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
            />
            <Input
              type="password"
              placeholder="New password (minimum 8 characters)"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? <LoaderCircle className="animate-spin" /> : <Save />}
            {saving ? "Saving changes..." : "Save changes"}
          </Button>
        </form>
      </div>
    </section>
  );
}
