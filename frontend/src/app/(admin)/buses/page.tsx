import { getAllBuses } from "@/action/bus.action";
import { listOperatorsAction } from "@/action/operator.action";
import AdminBusesClient from "@/components/admin/pages/admin-buses-client";
import type { Bus, Operator } from "@/lib/types";

export default async function AdminBusesPage() {
  const [busesResponse, operatorsResponse] = await Promise.all([
    getAllBuses(),
    listOperatorsAction(),
  ]);

  const buses: Bus[] =
    busesResponse.success && Array.isArray(busesResponse.buses)
      ? busesResponse.buses
      : [];

  const operators: Operator[] =
    operatorsResponse.success && Array.isArray(operatorsResponse.data)
      ? (operatorsResponse.data as Operator[])
      : [];

  return (
    <AdminBusesClient
      initialBuses={buses}
      initialOperators={operators}
    />
  );
}
