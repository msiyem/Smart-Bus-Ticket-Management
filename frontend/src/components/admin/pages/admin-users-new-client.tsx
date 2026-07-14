"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  MapPin,
  ShieldCheck,
  User as UserIcon,
  UserPlus,
} from "lucide-react";

import {
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/admin-page-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUserAction } from "@/action/users.action";
import type { UserRole } from "@/lib/types";
import { z } from "zod";
import { createUserAdminSchema } from "@/lib/validations/user";

type CreateUserAdminData = z.infer<typeof createUserAdminSchema>;

export default function AdminUsersNewClient() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateUserAdminData, unknown, CreateUserAdminData>({
    resolver: zodResolver(createUserAdminSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      address: "",
      role: "user",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (values: CreateUserAdminData) => {
    setSubmitting(true);
    try {
      const result = await createUserAction({
        name: values.name,
        username: values.username?.trim() ? values.username.trim() : undefined,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        address: values.address,
        role: values.role as UserRole,
      });

      if (!result.success) {
        toast.error(result.message || "Failed to create user");
        setSubmitting(false);
        return;
      }

      toast.success(
        values.role === "operator"
          ? "Operator account created successfully"
          : values.role === "admin"
            ? "Admin account created successfully"
            : "User account created successfully",
      );
      setSubmitting(false);
      router.replace("/users");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create user";
      toast.error(message);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/40"
        >
          <Link href="/users">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to users
          </Link>
        </Button>
      </div>

      <AdminPageHeader
        title="Create User / Operator"
        description="Assign a role when creating the account. All fields are validated on both the client and the server."
      />

      <div className="mx-auto max-w-2xl">
        <AdminPanel
          title="New account"
          description="Set credentials, profile fields, and role for the new account."
        >
          <form
            className="space-y-3"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <UserIcon className="h-3.5 w-3.5" /> Full name
              </div>
              <Input
                {...register("name")}
                placeholder="Jane Doe"
                className="mt-1"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <UserIcon className="h-3.5 w-3.5" /> Username{" "}
                <span className="text-[10px] text-muted-foreground/70">
                  (optional)
                </span>
              </div>
              <Input
                {...register("username")}
                placeholder="janedoe"
                className="mt-1"
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> Email
              </div>
              <Input
                type="email"
                {...register("email")}
                placeholder="user@example.com"
                className="mt-1"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" /> Password
                </div>
                <Input
                  type="password"
                  {...register("password")}
                  placeholder="••••••••"
                  className="mt-1"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" /> Confirm
                </div>
                <Input
                  type="password"
                  {...register("confirmPassword")}
                  placeholder="••••••••"
                  className="mt-1"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> Address
              </div>
              <Input
                {...register("address")}
                placeholder="Street, city"
                className="mt-1"
              />
              {errors.address && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> Role
              </div>
              <Select
                value={selectedRole}
                onValueChange={(v) =>
                  setValue("role", v as CreateUserAdminData["role"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                asChild
                variant="ghost"
                type="button"
                className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/40"
              >
                <Link href="/users">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {submitting ? "Creating..." : "Create account"}
              </Button>
            </div>
          </form>
        </AdminPanel>
      </div>
    </div>
  );
}