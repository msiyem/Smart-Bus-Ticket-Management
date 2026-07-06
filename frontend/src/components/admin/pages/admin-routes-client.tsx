"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createRouteFormAction, getAllRoutes } from "@/action/route.action";
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
import { createRouteSchema, CreateRouteData } from "@/lib/validations/route";

export default function AdminRoutesClient({
  initialRoutes,
}: {
  initialRoutes: Route[];
}) {
  const [routes, setRoutes] = React.useState<Route[]>(initialRoutes);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRouteData>({
    resolver: zodResolver(createRouteSchema) as never,
    defaultValues: {
      source_city: "",
      destination_city: "",
      distance_km: 0,
      estimated_duration: 0,
    },
  });

  const loadRoutes = React.useCallback(async () => {
    const response = await getAllRoutes();

    if (response.success && Array.isArray(response.routes)) {
      setRoutes(response.routes);
      return;
    }

    toast.error(response.message || "Failed to load routes");
  }, []);

  const onSubmit = async (values: CreateRouteData) => {
    setSubmitting(true);
    const formData = new FormData();
    formData.append("source_city", values.source_city);
    formData.append("destination_city", values.destination_city);
    formData.append("distance_km", String(values.distance_km));
    formData.append("estimated_duration", String(values.estimated_duration));

    const result = await createRouteFormAction(undefined, formData);
    if (result.success) {
      toast.success("Route created successfully");
      reset({
        source_city: "",
        destination_city: "",
        distance_km: 0,
        estimated_duration: 0,
      });
      await loadRoutes();
    } else {
      toast.error(result.message || "Failed to create route");
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
          <form
            className="space-y-3"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div>
              <Input
                {...register("source_city")}
                placeholder="Source city"
              />
              {errors.source_city && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.source_city.message}
                </p>
              )}
            </div>
            <div>
              <Input
                {...register("destination_city")}
                placeholder="Destination city"
              />
              {errors.destination_city && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.destination_city.message}
                </p>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Input
                  type="number"
                  {...register("distance_km")}
                  placeholder="Distance (km)"
                  min={1}
                />
                {errors.distance_km && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.distance_km.message}
                  </p>
                )}
              </div>
              <div>
                <Input
                  type="number"
                  {...register("estimated_duration")}
                  placeholder="Duration (minutes)"
                  min={1}
                />
                {errors.estimated_duration && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.estimated_duration.message}
                  </p>
                )}
              </div>
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
