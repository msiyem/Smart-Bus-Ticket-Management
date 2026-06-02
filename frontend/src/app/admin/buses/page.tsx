import { getAllBuses } from "@/action/bus.action";
import AdminBusesClient from "@/components/admin/pages/admin-buses-client";
import type { Bus } from "@/lib/types";

export default async function AdminBusesPage() {
  const response = await getAllBuses();
  const buses: Bus[] =
    response.success && Array.isArray(response.buses) ? response.buses : [];

  return <AdminBusesClient initialBuses={buses} />;
}
