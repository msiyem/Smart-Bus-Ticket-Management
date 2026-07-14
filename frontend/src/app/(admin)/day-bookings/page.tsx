import { getBookingsByDay } from "@/action/booking.action";
import AdminDayBookingsClient from "@/components/admin/pages/admin-day-bookings-client";

type Props = {
  searchParams?: Promise<{ date?: string }>;
};

export default async function AdminDayBookingsPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const date = params.date || new Date().toISOString().slice(0, 10);

  const response = await getBookingsByDay(date);

  const schedules =
    response.success && Array.isArray(response.data) ? response.data : [];

  return (
    <AdminDayBookingsClient initialDate={date} initialSchedules={schedules} />
  );
}