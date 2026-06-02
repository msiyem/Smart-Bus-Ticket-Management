import { getAllBuses } from "@/action/bus.action";
import { getAllRoutes } from "@/action/route.action";
import AdminSchedulesClient from "@/components/admin/pages/admin-schedules-client";
import type { Bus, Route } from "@/lib/types";

export default async function AdminSchedulesPage() {
  const [routeResponse, busResponse] = await Promise.all([
    getAllRoutes(),
    getAllBuses(),
  ]);

  const routes: Route[] =
    routeResponse.success && Array.isArray(routeResponse.routes)
      ? routeResponse.routes
      : [];
  const buses: Bus[] =
    busResponse.success && Array.isArray(busResponse.buses)
      ? busResponse.buses
      : [];

  return <AdminSchedulesClient initialRoutes={routes} initialBuses={buses} />;
}
