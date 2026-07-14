"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Building2, Mail, Phone, User as UserIcon } from "lucide-react";

import { createOperatorAction } from "@/action/operator.action";
import {
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/admin-page-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import type { User } from "@/lib/types";
import { z } from "zod";
import { createOperatorSchema } from "@/lib/validations/operator";

type CreateOperatorInput = z.input<typeof createOperatorSchema>;
type CreateOperatorOutput = z.output<typeof createOperatorSchema>;

export default function AdminOperatorsNewClient({
  users,
  linkedOwnerIds,
}: {
  users: User[];
  linkedOwnerIds: number[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateOperatorInput, unknown, CreateOperatorOutput>({
    resolver: zodResolver(createOperatorSchema),
    defaultValues: {
      owner_user_id: 0 as unknown as number,
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const ownerUserId = watch("owner_user_id");

  const linkedSet = React.useMemo(
    () => new Set(linkedOwnerIds),
    [linkedOwnerIds],
  );

  const eligibleOwners = React.useMemo(
    () => users.filter((u) => u.role === "operator" && !linkedSet.has(u.id)),
    [users, linkedSet],
  );

  const onSubmit = async (values: CreateOperatorOutput) => {
    setSubmitting(true);
    const result = await createOperatorAction({
      owner_user_id: values.owner_user_id,
      name: values.name,
      email: values.email,
      phone: values.phone || undefined,
      address: values.address || undefined,
    });

    if (!result.success) {
      toast.error(result.message || "Failed to create operator");
      setSubmitting(false);
      return;
    }

    toast.success("Operator created successfully");
    setSubmitting(false);
    router.replace("/operators");
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
          <Link href="/operators">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to operators
          </Link>
        </Button>
      </div>

      <AdminPageHeader
        title="Create Operator"
        description="Link a registered user to a bus-operator company."
      />

      <div className="mx-auto max-w-2xl">
        <AdminPanel
          title="New operator"
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
              <Combobox
                items={eligibleOwners}
                itemToStringLabel={(u) =>
                  typeof u === "string" ? u : u.name || u.email
                }
                itemToStringValue={(u) =>
                  typeof u === "string" ? u : String(u.id)
                }
                isItemEqualToValue={(a, b) =>
                  typeof a === "string" || typeof b === "string"
                    ? false
                    : a.id === b.id
                }
                value={
                  eligibleOwners.find((u) => u.id === ownerUserId) ?? null
                }
                onValueChange={(value) => {
                  const next =
                    value && typeof value !== "string" ? value.id : 0;
                  setValue("owner_user_id", next, { shouldValidate: true });
                }}
              >
                <ComboboxInput
                  className="mt-1 w-full"
                  placeholder="Search owner by name or email..."
                  showTrigger
                />
                <ComboboxContent>
                  <ComboboxList>
                    {eligibleOwners.length === 0 ? (
                      <ComboboxEmpty>
                        No eligible users available
                      </ComboboxEmpty>
                    ) : (
                      eligibleOwners.map((u) => (
                        <ComboboxItem key={u.id} value={u}>
                          <span className="flex flex-col">
                            <span className="font-medium">
                              {u.name || u.email}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {u.email}
                            </span>
                          </span>
                        </ComboboxItem>
                      ))
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              {errors.owner_user_id && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.owner_user_id.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" /> Name
              </div>
              <Input
                {...register("name")}
                placeholder="Operator / company name"
                className="mt-1"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> Email
              </div>
              <Input
                type="email"
                {...register("email")}
                placeholder="contact@company.com"
                className="mt-1"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> Phone
              </div>
              <Input
                {...register("phone")}
                placeholder="+8801XXXXXXXXX (optional)"
                className="mt-1"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" /> Address
              </div>
              <Input
                {...register("address")}
                placeholder="Optional address"
                className="mt-1"
              />
              {errors.address && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                asChild
                variant="ghost"
                type="button"
                className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/40"
              >
                <Link href="/operators">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {submitting ? "Creating operator..." : "Create operator"}
              </Button>
            </div>
          </form>
        </AdminPanel>
      </div>
    </div>
  );
}