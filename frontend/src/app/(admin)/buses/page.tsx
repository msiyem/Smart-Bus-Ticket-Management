import { getAllBuses } from "@/action/bus.action";
import AdminBusesClient from "@/components/admin/pages/admin-buses-client";
import type { Bus } from "@/lib/types";

export default async function AdminBusesPage() {
  const busesResponse = await getAllBuses();

  const buses: Bus[] =
    busesResponse.success && Array.isArray(busesResponse.buses)
      ? busesResponse.buses
      : [];

  return <AdminBusesClient initialBuses={buses} />;
}