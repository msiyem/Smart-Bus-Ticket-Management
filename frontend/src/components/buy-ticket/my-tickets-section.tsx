import Link from "next/link";
import { CalendarDays, Clock3, Ticket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { MyBookingsResponse } from "@/types/booking";

const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

type MyTicketsSectionProps = {
  data: MyBookingsResponse | null;
  loading: boolean;
  error: string | null;
};

export function MyTicketsSection({
  data,
  loading,
  error,
}: MyTicketsSectionProps) {
  const upcomingTrips = data?.upcomingTrips ?? [];
  const recentPastTrips = data?.recentPastTrips ?? [];

  return (
    <section className="mt-10 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-600 dark:text-slate-400">
            My tickets
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-100 sm:text-3xl">
            Upcoming trips and recent history
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Recent trips are shown for the last 15 days.
        </p>
      </div>

      {loading ? (
        <Card className="border-slate-200/70 bg-white/80 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
          <CardContent className="flex items-center gap-3 py-6 text-sm text-slate-600 dark:text-slate-400">
            <Clock3 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            Loading your tickets...
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-rose-200 bg-rose-50/80 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/30">
          <CardContent className="py-6 text-sm text-rose-700 dark:text-rose-200">
            {error}
          </CardContent>
        </Card>
      ) : upcomingTrips.length === 0 && recentPastTrips.length === 0 ? (
        <Card className="border-slate-200/70 bg-white/80 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
          <CardContent className="flex items-center gap-3 py-6 text-sm text-slate-600 dark:text-slate-400">
            <Ticket className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            No tickets yet. Book a trip to see it here.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
              Upcoming trips
            </h3>
            {upcomingTrips.length > 0 ? (
              upcomingTrips.map((ticket) => (
                <Card
                  key={ticket.booking.id}
                  className="border-emerald-200/70 bg-white/90 shadow-sm dark:border-emerald-900/50 dark:bg-slate-950/80"
                >
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-slate-950 dark:text-slate-100">
                          {ticket.booking.source_city} to{" "}
                          {ticket.booking.destination_city}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Booking #{ticket.booking.id} •{" "}
                          {ticket.booking.booking_status}
                        </p>
                      </div>
                      <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        ৳{ticket.booking.total_amount}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Departure
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                          {formatDateTime(ticket.booking.departure_time)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Seats
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                          {ticket.seats
                            .map((seat) => seat.seat_number)
                            .join(", ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {ticket.booking.payment_status}
                      </span>
                      <Button
                        asChild
                        className="rounded-xl bg-slate-950 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
                      >
                        <Link href={`/booking/${ticket.booking.id}`}>
                          View ticket
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-slate-200/70 bg-white/80 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
                <CardContent className="py-6 text-sm text-slate-600 dark:text-slate-400">
                  You do not have any upcoming trips.
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-600 dark:text-slate-400">
              Recent past trips
            </h3>
            {recentPastTrips.length > 0 ? (
              recentPastTrips.map((ticket) => (
                <Card
                  key={ticket.booking.id}
                  className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80"
                >
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-slate-950 dark:text-slate-100">
                          {ticket.booking.source_city} to{" "}
                          {ticket.booking.destination_city}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Booking #{ticket.booking.id} •{" "}
                          {ticket.booking.booking_status}
                        </p>
                      </div>
                      <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        ৳{ticket.booking.total_amount}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Departure
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                          {formatDateTime(ticket.booking.departure_time)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Seats
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                          {ticket.seats
                            .map((seat) => seat.seat_number)
                            .join(", ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Completed within 15 days
                      </span>
                      <Button
                        asChild
                        variant="outline"
                        className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
                      >
                        <Link href={`/booking/${ticket.booking.id}`}>
                          View ticket
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-slate-200/70 bg-white/80 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
                <CardContent className="py-6 text-sm text-slate-600 dark:text-slate-400">
                  No recent past trips found in the last 15 days.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
