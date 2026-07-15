"use client";

import { useState } from "react";
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
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const upcomingTrips = data?.upcomingTrips ?? [];
  const recentPastTrips = data?.recentPastTrips ?? [];

  return (
    <section className="p-5 space-y-5">
      <div className="flex items-center gap-1 sm:gap-3">
        <div className="h-px w-1/2 bg-slate-200 dark:bg-slate-800"></div>
        {/* Toggle */}
        <div className="inline-flex text-nowrap rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "upcoming"
                ? "bg-white shadow dark:bg-slate-800"
                : ""
            }`}
          >
            Upcoming Tickets
          </button>

          <button
            onClick={() => setActiveTab("past")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "past" ? "bg-white shadow dark:bg-slate-800" : ""
            }`}
          >
            Past Tickets
          </button>
        </div>
        <div className="h-px w-1/2 bg-slate-200 dark:bg-slate-800"></div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-6">
            <Clock3 className="h-4 w-4" />
            Loading your tickets...
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-6 text-rose-600">{error}</CardContent>
        </Card>
      ) : upcomingTrips.length === 0 && recentPastTrips.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-6">
            <Ticket className="h-4 w-4" />
            No tickets yet. Book a trip to see it here.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Upcoming Tickets */}
          {activeTab === "upcoming" && (
            <div className="space-y-3 border rounded-xl border-emerald-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-emerald-900/50 dark:bg-emerald-950/40">
              <h3 className="text-sm text-center font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
                Upcoming trips
              </h3>

              {upcomingTrips.length > 0 ? (
                upcomingTrips.map((ticket) => (
                  <Card key={ticket.booking.id}>
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold">
                            {ticket.booking.source_city} to{" "}
                            {ticket.booking.destination_city}
                          </p>

                          <p className="text-sm text-slate-500">
                            Booking #{ticket.booking.id} •{" "}
                            {ticket.booking.booking_status}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Operator: {ticket.booking.operator_name || "Not specified"}
                          </p>
                        </div>

                        <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                          ৳{ticket.booking.total_amount}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                          <p className="text-xs uppercase text-slate-500">
                            Departure
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {formatDateTime(ticket.booking.departure_time)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                          <p className="text-xs uppercase text-slate-500">
                            Seats
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {ticket.seats
                              .map((seat) => seat.seat_number)
                              .join(", ")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-2 text-sm">
                          <CalendarDays className="h-4 w-4" />
                          {ticket.booking.payment_status}
                        </span>

                        <Button asChild>
                          <Link href={`/booking/${ticket.booking.id}`}>
                            View Ticket
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-6">
                    You do not have any upcoming trips.
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Past Tickets */}
          {activeTab === "past" && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-600 dark:text-slate-400">
                Recent past trips
              </h3>

              {recentPastTrips.length > 0 ? (
                recentPastTrips.map((ticket) => (
                  <Card key={ticket.booking.id}>
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold">
                            {ticket.booking.source_city} to{" "}
                            {ticket.booking.destination_city}
                          </p>

                          <p className="text-sm text-slate-500">
                            Booking #{ticket.booking.id} •{" "}
                            {ticket.booking.booking_status}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Operator: {ticket.booking.operator_name || "Not specified"}
                          </p>
                        </div>

                        <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold">
                          ৳{ticket.booking.total_amount}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                          <p className="text-xs uppercase text-slate-500">
                            Departure
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {formatDateTime(ticket.booking.departure_time)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                          <p className="text-xs uppercase text-slate-500">
                            Seats
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {ticket.seats
                              .map((seat) => seat.seat_number)
                              .join(", ")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-2 text-sm">
                          <CalendarDays className="h-4 w-4" />
                          Completed within 15 days
                        </span>

                        <Button asChild variant="outline">
                          <Link href={`/booking/${ticket.booking.id}`}>
                            View Ticket
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-6">
                    No recent past trips found in the last 15 days.
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
