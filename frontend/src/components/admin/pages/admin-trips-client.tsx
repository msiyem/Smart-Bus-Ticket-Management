"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

import {
  cancelTripAction,
  deleteTripAction,
  listTripsAction,
  updateTripAction,
} from "@/action/trip.action";
import {
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/admin-page-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { Trip, TripStatus } from "@/lib/types";
import { formatDateBD } from "@/lib/formatters";
import { z } from "zod";
import {
  updateTripSchema,
  TRIP_STATUSES,
} from "@/lib/validations/trip";

type UpdateTripInput = z.input<typeof updateTripSchema>;
type UpdateTripOutput = z.output<typeof updateTripSchema>;

type Filters = {
  status: "ALL" | TripStatus;
  search: string;
  date: string;
};

export default function AdminTripsClient({
  initialTrips,
}: {
  initialTrips: Trip[];
}) {
  const [trips, setTrips] = React.useState<Trip[]>(initialTrips);
  const [filters, setFilters] = React.useState<Filters>({
    status: "ALL",
    search: "",
    date: "",
  });
  const [editing, setEditing] = React.useState<Trip | null>(null);
  const [submittingEdit, setSubmittingEdit] = React.useState(false);
  const [cancellingId, setCancellingId] = React.useState<number | null>(null);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  const editForm = useForm<UpdateTripInput, unknown, UpdateTripOutput>({
    resolver: zodResolver(updateTripSchema),
    defaultValues: {
      fare: 0 as unknown as number,
      status: "SCHEDULED",
      cancelled_reason: "",
    },
  });

  // Reset the edit form whenever the dialog target changes.
  React.useEffect(() => {
    if (editing) {
      editForm.reset({
        fare: editing.fare,
        status: editing.status,
        cancelled_reason: editing.cancelled_reason ?? "",
        actual_departure_time: editing.actual_departure_time ?? undefined,
        actual_arrival_time: editing.actual_arrival_time ?? undefined,
      });
    }
  }, [editing, editForm]);

  const loadTrips = React.useCallback(async () => {
    // Backend `listTrips` only accepts { schedule_id, date, status } as query
    // params; free-text search is applied client-side via `visibleTrips`.
    const params =
      filters.status === "ALL" && !filters.date
        ? undefined
        : {
            ...(filters.status !== "ALL" ? { status: filters.status } : {}),
            ...(filters.date ? { date: filters.date } : {}),
          };

    const response = await listTripsAction(params);
    if (response.success && Array.isArray(response.data)) {
      setTrips(response.data as Trip[]);
      return;
    }
    toast.error(response.message || "Failed to load trips");
  }, [filters]);

  // The backend list endpoint doesn't currently support a free-text search or a
  // combined filter via these parameters. We do a client-side filter here so the
  // UI is still pleasant even if/until the backend grows `?q=`.
  const visibleTrips = React.useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    if (!q) return trips;
    return trips.filter((t) => {
      return (
        t.source_city?.toLowerCase().includes(q) ||
        t.destination_city?.toLowerCase().includes(q) ||
        t.bus_number?.toLowerCase().includes(q) ||
        t.operator_name?.toLowerCase().includes(q) ||
        String(t.trip_id).includes(q)
      );
    });
  }, [trips, filters.search]);

  // Auto-reload whenever the status filter changes (single-select). Date is
  // reloaded explicitly via the "Apply filters" button because date typing is
  // more deliberate and the user may still be picking.
  React.useEffect(() => {
    loadTrips();
    // loadTrips already depends on `filters`, so we only want to fire on status
    // changes here; the date branch is covered by the button below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status]);

  const applyDateFilter = () => {
    loadTrips();
  };

  const onSubmitEdit = async (values: UpdateTripOutput) => {
    if (!editing) return;
    setSubmittingEdit(true);
    const result = await updateTripAction(editing.trip_id, values);
    setSubmittingEdit(false);
    if (result.success) {
      toast.success("Trip updated");
      setEditing(null);
      setTrips((prev) =>
        prev.map((t) =>
          t.trip_id === editing.trip_id
            ? {
                ...t,
                ...values,
                cancelled_reason: values.cancelled_reason ?? null,
              }
            : t,
        ),
      );
    } else {
      toast.error(result.message || "Failed to update trip");
    }
  };

  const handleCancel = async (trip: Trip) => {
    const reason =
      typeof window !== "undefined"
        ? window.prompt(
            `Cancel trip on ${formatDateBD(trip.trip_date)}? Optional reason:`,
            trip.cancelled_reason ?? "",
          )
        : null;
    if (reason === null) return;
    setCancellingId(trip.trip_id);
    const result = await cancelTripAction(trip.trip_id, reason || undefined);
    setCancellingId(null);
    if (result.success) {
      toast.success("Trip cancelled");
      setTrips((prev) =>
        prev.map((t) =>
          t.trip_id === trip.trip_id
            ? {
                ...t,
                status: "CANCELLED",
                cancelled_reason: reason || null,
              }
            : t,
        ),
      );
    } else {
      toast.error(result.message || "Failed to cancel trip");
    }
  };

  const handleDelete = async (trip: Trip) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Delete trip on ${formatDateBD(trip.trip_date)}? This cannot be undone.`,
      )
    ) {
      return;
    }
    setDeletingId(trip.trip_id);
    const result = await deleteTripAction(trip.trip_id);
    setDeletingId(null);
    if (result.success) {
      toast.success("Trip deleted");
      setTrips((prev) => prev.filter((t) => t.trip_id !== trip.trip_id));
    } else {
      toast.error(result.message || "Failed to delete trip");
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Trip Management"
        description="Review concrete departures. Edit fare/status, cancel with reason, or delete empty trips."
      />

      <AdminPanel
        title="All Trips"
        description="Concrete trip instances generated from schedules. Filter by status, date, or text."
      >
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
          <Input
            placeholder="Search by route, bus, operator, trip id…"
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
          />
          <Input
            type="date"
            value={filters.date}
            onChange={(e) =>
              setFilters((f) => ({ ...f, date: e.target.value }))
            }
          />
          <Select
            value={filters.status}
            onValueChange={(v) =>
              setFilters((f) => ({ ...f, status: v as Filters["status"] }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {TRIP_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={applyDateFilter}
            className="border-emerald-200 dark:border-emerald-900"
          >
            Apply filters
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Bus</TableHead>
              <TableHead>Operator</TableHead>
              <TableHead>Departure</TableHead>
              <TableHead>Fare</TableHead>
              <TableHead>Seats</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[160px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleTrips.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-sm text-muted-foreground"
                >
                  No trips match your filters.
                </TableCell>
              </TableRow>
            ) : (
              visibleTrips.map((trip) => (
                <TableRow key={trip.trip_id}>
                  <TableCell className="text-xs">{formatDateBD(trip.trip_date)}</TableCell>
                  <TableCell className="font-medium">
                    {trip.source_city} → {trip.destination_city}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="flex flex-col">
                      <span className="font-medium">{trip.bus_number}</span>
                      <span className="text-muted-foreground">
                        {trip.bus_type}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {trip.operator_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {trip.departure_time
                      ? new Date(trip.departure_time).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs">৳{trip.fare}</TableCell>
                  <TableCell className="text-xs">
                    {trip.available_seats}/{trip.capacity}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                        (trip.status === "SCHEDULED"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : trip.status === "CANCELLED"
                            ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                            : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300")
                      }
                    >
                      {trip.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditing(trip)}
                        aria-label="Edit trip"
                        className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/40"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancel(trip)}
                        disabled={
                          cancellingId === trip.trip_id ||
                          trip.status === "CANCELLED"
                        }
                        className="text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:hover:bg-amber-950/40"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(trip)}
                        disabled={deletingId === trip.trip_id}
                        aria-label="Delete trip"
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

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit trip</DialogTitle>
            <DialogDescription>
              {editing
                ? `Trip #${editing.trip_id} — ${editing.source_city} → ${editing.destination_city} on ${formatDateBD(editing.trip_date)}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={editForm.handleSubmit(onSubmitEdit)}
            className="space-y-3"
          >
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Fare (BDT)
              </label>
              <Input
                type="number"
                min={0}
                {...editForm.register("fare")}
                className="mt-1"
              />
              {editForm.formState.errors.fare && (
                <p className="mt-1 text-xs text-red-500">
                  {editForm.formState.errors.fare.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Status
              </label>
              <Select
                value={editForm.watch("status") ?? "SCHEDULED"}
                onValueChange={(v) =>
                  editForm.setValue("status", v as TripStatus, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {TRIP_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Cancellation reason (optional)
              </label>
              <Input
                {...editForm.register("cancelled_reason")}
                placeholder="Visible to passengers after cancel"
                className="mt-1"
              />
              {editForm.formState.errors.cancelled_reason && (
                <p className="mt-1 text-xs text-red-500">
                  {editForm.formState.errors.cancelled_reason.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingEdit}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {submittingEdit ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
