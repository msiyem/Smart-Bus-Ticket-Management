"use client";

import React from "react";
import { toast } from "sonner";

import { createBus, getAllBuses } from "@/action/bus.action";
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
import type { Bus, BusType } from "@/lib/types";

export default function AdminBusesClient({
  initialBuses,
}: {
  initialBuses: Bus[];
}) {
  const [busNumber, setBusNumber] = React.useState("");
  const [busType, setBusType] = React.useState<BusType>("NON_AC");
  const [capacity, setCapacity] = React.useState<number>(40);
  const [operatorName, setOperatorName] = React.useState("");
  const [buses, setBuses] = React.useState<Bus[]>(initialBuses);
  const [submitting, setSubmitting] = React.useState(false);

  const loadBuses = React.useCallback(async () => {
    const response = await getAllBuses();

    if (response.success && Array.isArray(response.buses)) {
      setBuses(response.buses as Bus[]);
      return;
    }

    toast.error(response.message || "Failed to load buses");
  }, []);

  const handleCreateBus = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!busNumber || !operatorName || capacity <= 0) {
      toast.warning("Provide valid bus information");
      return;
    }

    setSubmitting(true);

    const response = await createBus({
      bus_number: busNumber,
      bus_type: busType,
      capacity,
      operator_name: operatorName,
    });

    if (response.success) {
      toast.success("Bus created successfully");
      setBusNumber("");
      setOperatorName("");
      setBusType("NON_AC");
      setCapacity(40);
      await loadBuses();
    } else {
      toast.error(response.message || "Failed to create bus");
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
          <form className="space-y-3" onSubmit={handleCreateBus}>
            <Input
              value={busNumber}
              onChange={(event) => setBusNumber(event.target.value)}
              placeholder="Bus number"
            />
            <Select
              value={busType}
              onValueChange={(value) => setBusType(value as BusType)}
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
            <Input
              type="number"
              min={1}
              value={capacity}
              onChange={(event) => setCapacity(Number(event.target.value))}
              placeholder="Capacity"
            />
            <Input
              value={operatorName}
              onChange={(event) => setOperatorName(event.target.value)}
              placeholder="Operator name"
            />
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
