import { getAllBuses } from "@/action/bus.action";
import { getAllRoutes } from "@/action/route.action";
import AdminSchedulesNewClient from "@/components/admin/pages/admin-schedules-new-client";
import type { Bus, Route } from "@/lib/types";

export default async function AdminSchedulesNewPage() {
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

  return <AdminSchedulesNewClient routes={routes} buses={buses} />;
}