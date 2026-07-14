"use client";

import React from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { deleteSchedule, updateSchedule } from "@/action/schedule.action";
import {
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/admin-page-primitives";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Schedule, ScheduleStatus } from "@/lib/types";

// Weekday bit positions matching the backend (Mon=0, Sun=6).
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_BITS = [1, 2, 4, 8, 16, 32, 64];

function masksToDays(mask: number): string[] {
  return WEEKDAY_LABELS.filter((_, idx) => (mask & WEEKDAY_BITS[idx]) !== 0);
}

export default function AdminSchedulesClient({
  initialSchedules,
}: {
  initialSchedules: Schedule[];
}) {
  const [schedules, setSchedules] =
    React.useState<Schedule[]>(initialSchedules);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  const handleDelete = async (scheduleId: number) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Delete this schedule? This cannot be undone.")
    ) {
      return;
    }
    setDeletingId(scheduleId);

    const result = await deleteSchedule(scheduleId);

    if (result.success) {
      toast.success("Schedule deleted");
      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
    } else {
      toast.error(result.message || "Failed to delete schedule");
    }
    setDeletingId(null);
  };

  const handleStatusToggle = async (schedule: Schedule) => {
    // COMPLETED is a terminal state — don't silently downgrade it to
    // SCHEDULED via the Suspend/Resume action.
    if (schedule.status === "COMPLETED") {
      toast.error("Completed schedules cannot be toggled.");
      return;
    }
    const nextStatus: ScheduleStatus =
      schedule.status === "SCHEDULED" ? "CANCELLED" : "SCHEDULED";
    const result = await updateSchedule(schedule.id, { status: nextStatus });
    if (result.success) {
      toast.success(`Schedule ${nextStatus.toLowerCase()}`);
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === schedule.id ? { ...s, status: nextStatus } : s,
        ),
      );
    } else {
      toast.error(result.message || "Failed to update schedule");
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Schedule Management"
        description="Attach buses to routes, plan departures, and control which weekdays each schedule repeats on."
        action={{ label: "Create schedule", href: "/schedules/new" }}
      />

      <AdminPanel
        title="Existing Schedules"
        description="All schedules currently registered. Toggle status to suspend without deleting."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Route</TableHead>
              <TableHead>Bus</TableHead>
              <TableHead>Departure</TableHead>
              <TableHead>Arrival</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Fare</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[140px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-sm text-muted-foreground"
                >
                  No schedules yet. Create one to populate this list.
                </TableCell>
              </TableRow>
            ) : (
              schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className="font-medium">
                    {(schedule.source_city ?? "?") +
                      " → " +
                      (schedule.destination_city ?? "?")}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span className="font-medium">
                        {schedule.bus_number ?? "—"}
                      </span>
                      <span className="text-muted-foreground">
                        {schedule.bus_type ?? ""}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {schedule.departure_time
                      ? new Date(schedule.departure_time).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {schedule.arrival_time
                      ? new Date(schedule.arrival_time).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {masksToDays(schedule.repeat_days).join(", ") || "—"}
                  </TableCell>
                  <TableCell className="text-xs">৳{schedule.fare}</TableCell>
                  <TableCell className="text-xs">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                        (schedule.status === "SCHEDULED"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : schedule.status === "CANCELLED"
                            ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                            : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300")
                      }
                    >
                      {schedule.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStatusToggle(schedule)}
                        disabled={schedule.status === "COMPLETED"}
                        title={
                          schedule.status === "COMPLETED"
                            ? "Completed schedules cannot be toggled"
                            : undefined
                        }
                        className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/40 disabled:opacity-50"
                      >
                        {schedule.status === "SCHEDULED"
                          ? "Suspend"
                          : "Resume"}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(schedule.id)}
                        disabled={deletingId === schedule.id}
                        aria-label="Delete schedule"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminPanel>
    </div>
  );
}