"use client";

import React from "react";
import { toast } from "sonner";

import { createRoute, getAllRoutes } from "@/action/route.action";
import {
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/admin-page-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Route } from "@/lib/types";

export default function AdminRoutesClient({
  initialRoutes,
}: {
  initialRoutes: Route[];
}) {
  const [sourceCity, setSourceCity] = React.useState("");
  const [destinationCity, setDestinationCity] = React.useState("");
  const [distanceKm, setDistanceKm] = React.useState<number>(0);
  const [estimatedDuration, setEstimatedDuration] = React.useState<number>(0);
  const [routes, setRoutes] = React.useState<Route[]>(initialRoutes);
  const [submitting, setSubmitting] = React.useState(false);

  const loadRoutes = React.useCallback(async () => {
    const response = await getAllRoutes();

    if (response.success && Array.isArray(response.routes)) {
      setRoutes(response.routes);
      return;
    }

    toast.error(response.message || "Failed to load routes");
  }, []);

  const handleCreateRoute = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !sourceCity ||
      !destinationCity ||
      distanceKm <= 0 ||
      estimatedDuration <= 0
    ) {
      toast.warning("Fill all fields with valid values");
      return;
    }

    setSubmitting(true);

    const response = await createRoute({
      source_city: sourceCity,
      destination_city: destinationCity,
      distance_km: distanceKm,
      estimated_duration: estimatedDuration,
    });

    if (response.success) {
      toast.success("Route created successfully");
      setSourceCity("");
      setDestinationCity("");
      setDistanceKm(0);
      setEstimatedDuration(0);
      await loadRoutes();
    } else {
      toast.error(response.message || "Failed to create route");
    }

    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Route Management"
        description="Create city-to-city routes and keep your route inventory updated."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <AdminPanel
          title="Create Route"
          description="Add source, destination, distance, and duration."
        >
          <form className="space-y-3" onSubmit={handleCreateRoute}>
            <Input
              value={sourceCity}
              onChange={(event) => setSourceCity(event.target.value)}
              placeholder="Source city"
            />
            <Input
              value={destinationCity}
              onChange={(event) => setDestinationCity(event.target.value)}
              placeholder="Destination city"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                type="number"
                value={distanceKm}
                onChange={(event) => setDistanceKm(Number(event.target.value))}
                placeholder="Distance (km)"
                min={1}
              />
              <Input
                type="number"
                value={estimatedDuration}
                onChange={(event) =>
                  setEstimatedDuration(Number(event.target.value))
                }
                placeholder="Duration (minutes)"
                min={1}
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {submitting ? "Creating route..." : "Create route"}
            </Button>
          </form>
        </AdminPanel>

        <AdminPanel
          title="Existing Routes"
          description="Live routes currently available in the system."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.map((route) => (
                <TableRow key={route.id}>
                  <TableCell>{route.source_city}</TableCell>
                  <TableCell>{route.destination_city}</TableCell>
                  <TableCell>{route.distance_km} km</TableCell>
                  <TableCell>{route.estimated_duration} min</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AdminPanel>
      </div>
    </div>
  );
}
