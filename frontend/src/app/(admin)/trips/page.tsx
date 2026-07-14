import { listTripsAction } from "@/action/trip.action";
import AdminTripsClient from "@/components/admin/pages/admin-trips-client";
import type { Trip } from "@/lib/types";

export default async function AdminTripsPage() {
  const response = await listTripsAction();

  const trips: Trip[] =
    response.success && Array.isArray(response.data)
      ? (response.data as Trip[])
      : [];

  return <AdminTripsClient initialTrips={trips} />;
}