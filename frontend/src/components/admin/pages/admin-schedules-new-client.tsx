"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";

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
import { DateTimePicker } from "@/components/shared/date-time-picker";
import type { Bus, Route } from "@/lib/types";
import { createScheduleSchema } from "@/lib/validations/schedule";

type CreateScheduleInput = z.input<typeof createScheduleSchema>;
type CreateScheduleOutput = z.output<typeof createScheduleSchema>;

// Weekday bit positions matching the backend (Mon=0, Sun=6).
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_BITS = [1, 2, 4, 8, 16, 32, 64];

function bitFor(label: string): number {
  const idx = WEEKDAY_LABELS.indexOf(label);
  return idx === -1 ? 0 : WEEKDAY_BITS[idx];
}

function daysToMask(days: string[]): number {
  // An empty selection maps to 0 (= never runs). Otherwise OR each weekday bit.
  return days.reduce((acc, d) => acc | bitFor(d), 0);
}

export default function AdminSchedulesNewClient({
  routes,
  buses,
}: {
  routes: Route[];
  buses: Bus[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [weekdays, setWeekdays] = React.useState<string[]>(
    WEEKDAY_LABELS.slice(),
  );

  const {
    handleSubmit,
    setValue,
    watch,
    register,
    formState: { errors },
  } = useForm<CreateScheduleInput, unknown, CreateScheduleOutput>({
    resolver: zodResolver(createScheduleSchema),
    defaultValues: {
      // Use `0` only as a UI placeholder — Zod will reject it on submit and
      // surface "route is required" / "bus is required". The form stays
      // visually empty until a real selection is made.
      route_id: 0 as unknown as number,
      bus_id: 0 as unknown as number,
      departure_time: "",
      arrival_time: "",
      fare: 0 as unknown as number,
    },
  });

  const routeId = watch("route_id");
  const busId = watch("bus_id");
  const departureTime = watch("departure_time");
  const arrivalTime = watch("arrival_time");

  const toggleWeekday = (label: string) => {
    setWeekdays((prev) => {
      const next = prev.includes(label)
        ? prev.filter((d) => d !== label)
        : [...prev, label];
      // Allow the user to deselect all days — backend treats 0 as "never",
      // which matches the UI intent of having an empty selection.
      return next;
    });
  };

  const onSubmit = async (values: CreateScheduleOutput) => {
    setSubmitting(true);
    const formData = new FormData();
    formData.append("route_id", String(values.route_id));
    formData.append("bus_id", String(values.bus_id));
    formData.append("departure_time", values.departure_time);
    formData.append("arrival_time", values.arrival_time);
    formData.append("fare", String(values.fare));
    const repeatDays = daysToMask(weekdays);
    formData.append("repeat_days", String(repeatDays));

    const result = await createScheduleFormAction(undefined, formData);
    if (!result.success) {
      toast.error(result.message || "Failed to create schedule");
      setSubmitting(false);
      return;
    }

    // If no weekdays are selected the schedule will never run — keep DB
    // consistent by flipping it to CANCELLED right after creation.
    if (repeatDays === 0 && result.data?.scheduleId) {
      const { updateSchedule } = await import("@/action/schedule.action");
      const cancel = await updateSchedule(result.data.scheduleId, {
        status: "CANCELLED",
      });
      if (!cancel.success) {
        toast.warning(
          "Schedule created, but failed to mark as cancelled (no repeat days).",
        );
      }
    }

    toast.success("Schedule created successfully");
    setSubmitting(false);
    router.replace("/schedules");
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
          <Link href="/schedules">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to schedules
          </Link>
        </Button>
      </div>

      <AdminPageHeader
        title="Create Schedule"
        description="Attach a bus to a route, plan departures and arrivals, and pick which weekdays the schedule repeats on."
      />

      <div className="mx-auto max-w-2xl">
        <AdminPanel
          title="New schedule"
          description="Choose route and bus, then pick departure/arrival times and repeat days."
        >
          <form
            className="space-y-3"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Route
              </div>
              <Select
                value={routeId ? String(routeId) : ""}
                onValueChange={(v) =>
                  setValue("route_id", Number(v), { shouldValidate: true })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={String(route.id)}>
                      {route.source_city} → {route.destination_city}
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

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Bus
              </div>
              <Select
                value={busId ? String(busId) : ""}
                onValueChange={(v) =>
                  setValue("bus_id", Number(v), { shouldValidate: true })
                }
              >
                <SelectTrigger className="mt-1">
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

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Departure
              </div>
              <div className="mt-1">
                <DateTimePicker
                  value={departureTime}
                  onChange={(v) =>
                    setValue("departure_time", v, { shouldValidate: true })
                  }
                  placeholder="Departure time"
                />
              </div>
              {errors.departure_time && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.departure_time.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Arrival
              </div>
              <div className="mt-1">
                <DateTimePicker
                  value={arrivalTime}
                  onChange={(v) =>
                    setValue("arrival_time", v, { shouldValidate: true })
                  }
                  placeholder="Arrival time"
                />
              </div>
              {errors.arrival_time && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.arrival_time.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Fare (BDT)
              </div>
              <Input
                type="number"
                min={0}
                {...register("fare")}
                placeholder="Fare"
                className="mt-1"
              />
              {errors.fare && (
                <p className="mt-1 text-xs text-red-500">{errors.fare.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Repeat on
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {WEEKDAY_LABELS.map((label) => {
                  const active = weekdays.includes(label);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleWeekday(label)}
                      aria-pressed={active}
                      className={
                        "rounded-md border px-2.5 py-1 text-xs font-medium transition " +
                        (active
                          ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                          : "border-emerald-200 bg-white text-emerald-700 hover:border-emerald-400 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300")
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {weekdays.length === 0
                  ? "No days selected — schedule will not run."
                  : `Runs ${weekdays.length === 7 ? "every day" : `on ${weekdays.join(", ")}`}.`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                asChild
                variant="ghost"
                type="button"
                className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/40"
              >
                <Link href="/schedules">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {submitting ? "Creating schedule..." : "Create schedule"}
              </Button>
            </div>
          </form>
        </AdminPanel>
      </div>
    </div>
  );
}