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
import type { Bus } from "@/lib/types";

export default function AdminBusesClient({
  initialBuses,
}: {
  initialBuses: Bus[];
}) {
  const [buses] = React.useState<Bus[]>(initialBuses);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Bus Management"
        description="Create and review buses available for future schedules."
        action={{ label: "Create bus", href: "/buses/new" }}
      />

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
  );
}