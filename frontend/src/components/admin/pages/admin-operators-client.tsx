"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Building2, Mail, Phone, Power, Trash2, User as UserIcon } from "lucide-react";

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
import {
  createOperatorAction,
  deleteOperatorAction,
  listOperatorsAction,
} from "@/action/operator.action";
import { getAllUsers } from "@/action/users.action";
import type { Operator, User } from "@/lib/types";
import { createOperatorSchema, CreateOperatorData } from "@/lib/validations/operator";

type StatusValue = "active" | "inactive";

export default function AdminOperatorsClient({
  initialOperators,
  initialUsers,
}: {
  initialOperators: Operator[];
  initialUsers: User[];
}) {
  const [operators, setOperators] = React.useState<Operator[]>(initialOperators);
  const [users, setUsers] = React.useState<User[]>(initialUsers);
  const [submitting, setSubmitting] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<"all" | StatusValue>(
    "all",
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateOperatorData>({
    resolver: zodResolver(createOperatorSchema) as never,
    defaultValues: {
      owner_user_id: 0,
      company_name: "",
      contact_email: "",
      contact_phone: "",
      is_active: true,
    },
  });

  const ownerUserId = watch("owner_user_id");
  const isActive = watch("is_active");

  const ownersById = React.useMemo(
    () => new Map(users.map((u) => [u.id, u])),
    [users],
  );

  // console.log("users", users);

  const linkedOwnerIds = React.useMemo(
    () => new Set(operators.map((op) => op.owner_user_id)),
    [operators],
  );

  const eligibleOwners = React.useMemo(
    () =>
      users.filter(
        (u) => u.role === "operator" && !linkedOwnerIds.has(u.id),
      ),
    [users, linkedOwnerIds],
  );

  const filteredOperators = React.useMemo(() => {
    if (statusFilter === "all") return operators;
    return operators.filter((op) =>
      statusFilter === "active" ? op.is_active : !op.is_active,
    );
  }, [operators, statusFilter]);

  const loadOperators = React.useCallback(async () => {
    const response = await listOperatorsAction();
    if (response.success && Array.isArray(response.data)) {
      setOperators(response.data as Operator[]);
      return;
    }
    toast.error(response.message || "Failed to load operators");
  }, []);

  const loadUsers = React.useCallback(async () => {
    const response = await getAllUsers();
    if (response.success && Array.isArray(response)) {
      setUsers(response as User[]);
      return;
    }
    toast.error(response.message || "Failed to load users");
  }, []);

  const onSubmit = async (values: CreateOperatorData) => {
    setSubmitting(true);
    const result = await createOperatorAction({
      owner_user_id: values.owner_user_id,
      company_name: values.company_name,
      contact_email: values.contact_email,
      contact_phone: values.contact_phone || undefined,
      is_active: values.is_active,
    });

    if (result.success) {
      toast.success("Operator created successfully");
      reset({
        owner_user_id: 0,
        company_name: "",
        contact_email: "",
        contact_phone: "",
        is_active: true,
      });
      await loadOperators();
      await loadUsers();
    } else {
      toast.error(result.message || "Failed to create operator");
    }
    setSubmitting(false);
  };

  const handleDelete = async (operatorId: number) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Delete this operator? This cannot be undone.")
    ) {
      return;
    }
    const result = await deleteOperatorAction(operatorId);
    if (result.success) {
      toast.success("Operator deleted");
      await loadOperators();
    } else {
      toast.error(result.message || "Failed to delete operator");
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Operator Management"
        description="Link a registered user to a bus-operator company and keep their active status in sync."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <AdminPanel
          title="Create Operator"
          description="Choose a user, then capture the company details."
        >
          <form
            className="space-y-3"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <UserIcon className="h-3.5 w-3.5" /> Owner
              </div>
              <Select
                value={ownerUserId ? String(ownerUserId) : ""}
                onValueChange={(v) =>
                  setValue("owner_user_id", Number(v), {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select an owner user" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleOwners.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      No eligible users available
                    </SelectItem>
                  ) : (
                    eligibleOwners.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {(u.name || u.email) + ` • ${u.email}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.owner_user_id && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.owner_user_id.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" /> Company
              </div>
              <Input
                {...register("company_name")}
                placeholder="Company name"
                className="mt-1"
              />
              {errors.company_name && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.company_name.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> Contact email
              </div>
              <Input
                type="email"
                {...register("contact_email")}
                placeholder="contact@company.com"
                className="mt-1"
              />
              {errors.contact_email && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.contact_email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> Contact phone
              </div>
              <Input
                {...register("contact_phone")}
                placeholder="+8801XXXXXXXXX (optional)"
                className="mt-1"
              />
              {errors.contact_phone && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.contact_phone.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Power className="h-3.5 w-3.5" /> Status
              </div>
              <Select
                value={isActive ? "active" : "inactive"}
                onValueChange={(v) =>
                  setValue("is_active", v === "active", {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {submitting ? "Creating operator..." : "Create operator"}
            </Button>
          </form>
        </AdminPanel>

        <AdminPanel
          title="Existing Operators"
          description="Operators currently linked to user accounts."
        >
          <div className="mb-3 flex items-center justify-end gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Filter
            </span>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as "all" | StatusValue)}
            >
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOperators.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-sm text-muted-foreground"
                  >
                    No operators found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOperators.map((op) => {
                  const owner = ownersById.get(op.owner_user_id);
                  return (
                    <TableRow key={op.id}>
                      <TableCell className="font-medium">
                        {op.company_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{owner?.name || "—"}</span>
                          <span className="text-xs text-muted-foreground">
                            {owner?.email || op.contact_email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span>{op.contact_email}</span>
                          <span className="text-muted-foreground">
                            {op.contact_phone || "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold " +
                            (op.is_active
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300")
                          }
                        >
                          {op.is_active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(op.id)}
                          aria-label="Delete operator"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </AdminPanel>
      </div>
    </div>
  );
}
