"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createScheduleFormAction } from "@/action/schedule.admin.action";
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
import type { Bus, Route } from "@/lib/types";
import { DateTimePicker } from "@/components/shared/date-time-picker";
import {
  createScheduleSchema,
  CreateScheduleData,
} from "@/lib/validations/schedule";

export default function AdminSchedulesClient({
  initialRoutes,
  initialBuses,
}: {
  initialRoutes: Route[];
  initialBuses: Bus[];
}) {
  const [routes] = React.useState<Route[]>(initialRoutes);
  const [buses] = React.useState<Bus[]>(initialBuses);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    register,
    formState: { errors },
  } = useForm<CreateScheduleData>({
    resolver: zodResolver(createScheduleSchema) as never,
    defaultValues: {
      route_id: 0,
      bus_id: 0,
      departure_time: "",
      arrival_time: "",
      fare: 0,
    },
  });

  const routeId = watch("route_id");
  const busId = watch("bus_id");
  const departureTime = watch("departure_time");
  const arrivalTime = watch("arrival_time");

  const onSubmit = async (values: CreateScheduleData) => {
    setSubmitting(true);
    const formData = new FormData();
    formData.append("route_id", String(values.route_id));
    formData.append("bus_id", String(values.bus_id));
    formData.append("departure_time", values.departure_time);
    formData.append("arrival_time", values.arrival_time);
    formData.append("fare", String(values.fare));

    const result = await createScheduleFormAction(undefined, formData);
    if (result.success) {
      toast.success("Schedule created successfully");
      reset({
        route_id: 0,
        bus_id: 0,
        departure_time: "",
        arrival_time: "",
        fare: 0,
      });
    } else {
      toast.error(result.message || "Failed to create schedule");
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Schedule Management"
        description="Attach buses to routes with departure and arrival planning."
      />

      <AdminPanel
        title="Create Schedule"
        description="Choose route and bus from the current inventory."
      >
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="md:col-span-1">
            <Select
              value={routeId ? String(routeId) : ""}
              onValueChange={(v) =>
                setValue("route_id", Number(v), { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select route" />
              </SelectTrigger>
              <SelectContent>
                {routes.map((route) => (
                  <SelectItem key={route.id} value={String(route.id)}>
                    {route.source_city} to {route.destination_city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.route_id && (
              <p className="mt-1 text-xs text-red-500">
                {errors.route_id.message}
              </p>
            )}
          </div>

          <div className="md:col-span-1">
            <Select
              value={busId ? String(busId) : ""}
              onValueChange={(v) =>
                setValue("bus_id", Number(v), { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select bus" />
              </SelectTrigger>
              <SelectContent>
                {buses.map((bus) => (
                  <SelectItem key={bus.id} value={String(bus.id)}>
                    {bus.bus_number} • {bus.bus_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.bus_id && (
              <p className="mt-1 text-xs text-red-500">{errors.bus_id.message}</p>
            )}
          </div>

          <div className="md:col-span-1">
            <DateTimePicker
              value={departureTime}
              onChange={(v) =>
                setValue("departure_time", v, { shouldValidate: true })
              }
              placeholder="Departure time"
            />
            {errors.departure_time && (
              <p className="mt-1 text-xs text-red-500">
                {errors.departure_time.message}
              </p>
            )}
          </div>

          <div className="md:col-span-1">
            <DateTimePicker
              value={arrivalTime}
              onChange={(v) =>
                setValue("arrival_time", v, { shouldValidate: true })
              }
              placeholder="Arrival time"
            />
            {errors.arrival_time && (
              <p className="mt-1 text-xs text-red-500">
                {errors.arrival_time.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <Input
              type="number"
              min={1}
              {...register("fare")}
              placeholder="Fare"
            />
            {errors.fare && (
              <p className="mt-1 text-xs text-red-500">{errors.fare.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="md:col-span-2 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {submitting ? "Creating schedule..." : "Create schedule"}
          </Button>
        </form>
      </AdminPanel>
    </div>
  );
}
