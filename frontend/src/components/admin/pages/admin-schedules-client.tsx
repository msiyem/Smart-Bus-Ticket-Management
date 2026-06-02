"use client";

import React from "react";
import { toast } from "sonner";

import { createSchedule } from "@/action/schedule.admin.action";
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

export default function AdminSchedulesClient({
  initialRoutes,
  initialBuses,
}: {
  initialRoutes: Route[];
  initialBuses: Bus[];
}) {
  const [routeId, setRouteId] = React.useState<string>("");
  const [busId, setBusId] = React.useState<string>("");
  const [departureTime, setDepartureTime] = React.useState("");
  const [arrivalTime, setArrivalTime] = React.useState("");
  const [fare, setFare] = React.useState<number>(0);
  const [routes] = React.useState<Route[]>(initialRoutes);
  const [buses] = React.useState<Bus[]>(initialBuses);
  const [submitting, setSubmitting] = React.useState(false);

  const handleCreateSchedule = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!routeId || !busId || !departureTime || !arrivalTime || fare <= 0) {
      toast.warning("Fill all schedule fields first");
      return;
    }

    setSubmitting(true);

    const response = await createSchedule({
      route_id: Number(routeId),
      bus_id: Number(busId),
      departure_time: departureTime,
      arrival_time: arrivalTime,
      fare,
    });

    if (response.success) {
      toast.success("Schedule created successfully");
      setRouteId("");
      setBusId("");
      setDepartureTime("");
      setArrivalTime("");
      setFare(0);
    } else {
      toast.error(response.message || "Failed to create schedule");
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
          onSubmit={handleCreateSchedule}
        >
          <div className="md:col-span-1">
            <Select value={routeId} onValueChange={setRouteId}>
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
          </div>

          <div className="md:col-span-1">
            <Select value={busId} onValueChange={setBusId}>
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
          </div>

          <DateTimePicker
            value={departureTime}
            onChange={setDepartureTime}
            placeholder="Departure time"
          />

          <DateTimePicker
            value={arrivalTime}
            onChange={setArrivalTime}
            placeholder="Arrival time"
          />

          <Input
            type="number"
            min={1}
            value={fare}
            onChange={(event) => setFare(Number(event.target.value))}
            placeholder="Fare"
            className="md:col-span-2"
          />

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
