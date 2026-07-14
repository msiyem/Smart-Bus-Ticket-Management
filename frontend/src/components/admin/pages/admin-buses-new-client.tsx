"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Building2 } from "lucide-react";

import { createBusFormAction } from "@/action/bus.action";
import { listOperatorsAction } from "@/action/operator.action";
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
import type { BusType, Operator } from "@/lib/types";
import { z } from "zod";
import { createBusSchema } from "@/lib/validations/bus";

type CreateBusInput = z.input<typeof createBusSchema>;
type CreateBusOutput = z.output<typeof createBusSchema>;

export default function AdminBusesNewClient({
  operators: initialOperators,
}: {
  operators: Operator[];
}) {
  const router = useRouter();
  const [operators, setOperators] =
    React.useState<Operator[]>(initialOperators);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateBusInput, unknown, CreateBusOutput>({
    resolver: zodResolver(createBusSchema),
    defaultValues: {
      bus_number: "",
      bus_type: "NON_AC",
      capacity: 40 as unknown as number,
      operator_name: "",
    },
  });

  const busType = watch("bus_type");
  const operatorName = watch("operator_name");

  const loadOperators = React.useCallback(async () => {
    const response = await listOperatorsAction();
    if (response.success && Array.isArray(response.data)) {
      setOperators(response.data as Operator[]);
    }
  }, []);

  const onSubmit = async (values: CreateBusOutput) => {
    setSubmitting(true);
    const formData = new FormData();
    formData.append("bus_number", values.bus_number);
    formData.append("bus_type", values.bus_type);
    formData.append("capacity", String(values.capacity));
    formData.append("operator_name", values.operator_name);

    const result = await createBusFormAction(undefined, formData);
    if (!result.success) {
      toast.error(result.message || "Failed to create bus");
      setSubmitting(false);
      return;
    }

    toast.success("Bus created successfully");
    setSubmitting(false);
    router.replace("/buses");
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
          <Link href="/buses">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to buses
          </Link>
        </Button>
      </div>

      <AdminPageHeader
        title="Create Bus"
        description="Add a bus to your fleet and link it to an operator."
      />

      <div className="mx-auto max-w-2xl">
        <AdminPanel
          title="New bus"
          description="Set bus details and operator information."
        >
          <form
            className="space-y-3"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div>
              <Input
                {...register("bus_number")}
                placeholder="Bus number"
              />
              {errors.bus_number && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.bus_number.message}
                </p>
              )}
            </div>
            <div>
              <Select
                value={busType}
                onValueChange={(value) =>
                  setValue("bus_type", value as BusType, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bus type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NON_AC">NON_AC</SelectItem>
                  <SelectItem value="AC">AC</SelectItem>
                  <SelectItem value="SLEEPER">SLEEPER</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                </SelectContent>
              </Select>
              {errors.bus_type && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.bus_type.message}
                </p>
              )}
            </div>
            <div>
              <Input
                type="number"
                min={1}
                {...register("capacity")}
                placeholder="Capacity"
              />
              {errors.capacity && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.capacity.message}
                </p>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" /> Operator
              </div>
              <Select
                value={operatorName || ""}
                onValueChange={(v) =>
                  setValue("operator_name", v, { shouldValidate: true })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select operator" />
                </SelectTrigger>
                <SelectContent>
                  {operators.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      No operators available
                    </SelectItem>
                  ) : (
                    operators.map((op) => (
                      <SelectItem key={op.id} value={op.name}>
                        {op.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.operator_name && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.operator_name.message}
                </p>
              )}
              {operators.length === 0 ? (
                <button
                  type="button"
                  onClick={loadOperators}
                  className="mt-1 text-xs text-emerald-700 underline-offset-2 hover:underline"
                >
                  Refresh operators
                </button>
              ) : null}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                asChild
                variant="ghost"
                type="button"
                className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/40"
              >
                <Link href="/buses">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {submitting ? "Creating bus..." : "Create bus"}
              </Button>
            </div>
          </form>
        </AdminPanel>
      </div>
    </div>
  );
}