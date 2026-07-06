"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Building2 } from "lucide-react";

import { createBusFormAction, getAllBuses } from "@/action/bus.action";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Bus, BusType, Operator } from "@/lib/types";
import { createBusSchema, CreateBusData } from "@/lib/validations/bus";

export default function AdminBusesClient({
  initialBuses,
  initialOperators,
}: {
  initialBuses: Bus[];
  initialOperators: Operator[];
}) {
  const [buses, setBuses] = React.useState<Bus[]>(initialBuses);
  const [operators, setOperators] =
    React.useState<Operator[]>(initialOperators);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateBusData>({
    resolver: zodResolver(createBusSchema) as never,
    defaultValues: {
      bus_number: "",
      bus_type: "NON_AC",
      capacity: 40,
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

  const loadBuses = React.useCallback(async () => {
    const response = await getAllBuses();

    if (response.success && Array.isArray(response.buses)) {
      setBuses(response.buses as Bus[]);
      return;
    }

    toast.error(response.message || "Failed to load buses");
  }, []);

  const onSubmit = async (values: CreateBusData) => {
    setSubmitting(true);
    const formData = new FormData();
    formData.append("bus_number", values.bus_number);
    formData.append("bus_type", values.bus_type);
    formData.append("capacity", String(values.capacity));
    formData.append("operator_name", values.operator_name);

    const result = await createBusFormAction(undefined, formData);
    if (result.success) {
      toast.success("Bus created successfully");
      reset({
        bus_number: "",
        bus_type: "NON_AC",
        capacity: 40,
        operator_name: "",
      });
      await loadBuses();
    } else {
      toast.error(result.message || "Failed to create bus");
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Bus Management"
        description="Create and review buses available for future schedules."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <AdminPanel
          title="Create Bus"
          description="Set bus details and operator information."
        >
          <form className="space-y-3" onSubmit={handleSubmit(onSubmit)} noValidate>
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
                      <SelectItem key={op.id} value={op.company_name}>
                        {op.company_name}
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
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {submitting ? "Creating bus..." : "Create bus"}
            </Button>
          </form>
        </AdminPanel>

        <AdminPanel
          title="Existing Buses"
          description="Buses currently available in your fleet."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bus no.</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Operator</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buses.map((bus) => (
                <TableRow key={bus.id}>
                  <TableCell>{bus.bus_number}</TableCell>
                  <TableCell>{bus.bus_type}</TableCell>
                  <TableCell>{bus.capacity}</TableCell>
                  <TableCell>{bus.operator_name || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AdminPanel>
      </div>
    </div>
  );
}
