"use client";

import React from "react";

import {
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/admin-page-primitives";
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
  const [routes] = React.useState<Route[]>(initialRoutes);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Route Management"
        description="Create city-to-city routes and keep your route inventory updated."
        action={{ label: "Create route", href: "/routes/new" }}
      />

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
  );
}