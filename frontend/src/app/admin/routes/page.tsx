import { getAllRoutes } from "@/action/route.action";
import AdminRoutesClient from "@/components/admin/pages/admin-routes-client";
import type { Route } from "@/lib/types";

export default async function AdminRoutesPage() {
  const response = await getAllRoutes();
  const routes: Route[] =
    response.success && Array.isArray(response.routes) ? response.routes : [];

  return <AdminRoutesClient initialRoutes={routes} />;
}
