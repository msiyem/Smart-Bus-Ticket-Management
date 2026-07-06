"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createUserAction, getAllUsers } from "@/action/users.action";
import type { User, UserRole } from "@/lib/types";
import {
  createUserAdminSchema,
  type CreateUserAdminData,
} from "@/lib/validations/user";

export default function AdminUsersClient({
  initialUsers,
}: {
  initialUsers: User[];
}) {
  const [users, setUsers] = React.useState<User[]>(initialUsers);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateUserAdminData>({
    resolver: zodResolver(createUserAdminSchema) as never,
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

  const loadUsers = React.useCallback(async () => {
    try {
      const response = await getAllUsers();
      if (response.success && Array.isArray(response.data)) {
        setUsers(response.data as User[]);
      } else {
        toast.error(response.message || "Failed to load users");
      }
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Failed to load users");
    }
  }, []);

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

      if (result.success) {
        toast.success(
          values.role === "operator"
            ? "Operator account created successfully"
            : values.role === "admin"
              ? "Admin account created successfully"
              : "User account created successfully",
        );
        reset({
          name: "",
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
          address: "",
          role: "user",
        });
        await loadUsers();
      } else {
        toast.error(result.message || "Failed to create user");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create user";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="User Management"
        description="Create and review user accounts, including operator and admin roles."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <AdminPanel
          title="Create User / Operator"
          description="Assign a role when creating the account. All fields are validated on both the client and the server."
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
                <p className="mt-1 text-xs text-red-500">
                  {errors.name.message}
                </p>
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
                <p className="mt-1 text-xs text-red-500">
                  {errors.role.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {submitting ? "Creating..." : "Create account"}
            </Button>
          </form>
        </AdminPanel>

        <AdminPanel
          title="Registered Users"
          description="User accounts from the backend database."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Provider</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-sm text-muted-foreground"
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name || "-"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="uppercase">{user.role}</TableCell>
                    <TableCell>{user.provider || "local"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </AdminPanel>
      </div>
    </div>
  );
}
