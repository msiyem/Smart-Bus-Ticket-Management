import { listSchedules } from "@/action/schedule.action";
import AdminSchedulesClient from "@/components/admin/pages/admin-schedules-client";
import type { Schedule } from "@/lib/types";

export default async function AdminSchedulesPage() {
  const schedulesResponse = await listSchedules();

  const schedules: Schedule[] =
    schedulesResponse.success && Array.isArray(schedulesResponse.data)
      ? (schedulesResponse.data as Schedule[])
      : [];

  return <AdminSchedulesClient initialSchedules={schedules} />;
}