"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bus,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Printer,
  Ticket,
} from "lucide-react";

import { getBookingById } from "@/action/booking.action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BookingTicketDetails, User } from "@/lib/types";
import PrintReceipt from "./print-receipt";

type BookingTicketPageProps = {
  bookingId: number;
  user: User; 
};

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

export default function BookingTicketPage({
  bookingId,
  user,
}: BookingTicketPageProps) {
  const isValidBookingId = Number.isFinite(bookingId) && bookingId > 0;
  const [ticket, setTicket] = React.useState<BookingTicketDetails | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isValidBookingId) {
      setTimeout(() => {
        setLoading(false);
        setTicket(null);
        setError("Invalid booking link.");
      }, 0);
      return;
    }

    const loadTicket = async () => {
      setLoading(true);
      setError(null);
      const response = await getBookingById(bookingId);

      if (response?.success && response.data) {
        setTicket(response.data as BookingTicketDetails);
      } else {
        setTicket(null);
        setError(response?.message || "Unable to load this ticket.");
      }

      setLoading(false);
    };

    void loadTicket();
  }, [bookingId, isValidBookingId]);

  const printTicket = () => {
    window.print();
  };

  return (
    <main className="min-h-[calc(100vh-64px)] 
      bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.16),transparent_32%),
      linear-gradient(180deg,#eefdf2_0%,#ffffff_44%,#f4fbf6_100%)] px-4 py-8 text-slate-950 
      dark:bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.18),transparent_32%),linear-gradient(180deg,#052e16_0%,#03130b_46%,#020704_100%)] 
      dark:text-white sm:px-6 lg:px-8 print:min-h-0 print:bg-white print:px-0 print:py-0 print:text-slate-950">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 print:max-w-none print:gap-0">
        <div className="flex items-center justify-between gap-3 print:hidden">
          <Button
            asChild
            variant="ghost"
            className="rounded-full text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to search
            </Link>
          </Button>
          <Button
            className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700 print:hidden"
            onClick={printTicket}
          >
            <Printer className="h-4 w-4" />
            Print ticket
          </Button>
        </div>

        <Card className="border-emerald-200/70 bg-white/90 shadow-sm backdrop-blur dark:border-emerald-900/50 dark:bg-emerald-950/50 print:hidden">
          <CardHeader className="border-b border-emerald-100 dark:border-emerald-900/50 print:border-slate-200">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-300 print:bg-slate-100 print:text-slate-700">
                <Ticket className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700 dark:text-emerald-300 print:text-slate-600">
                  TicketMama
                </p>
                <CardTitle className="text-3xl text-slate-950 dark:text-white print:text-slate-900">
                  Booking ticket
                </CardTitle>
              </div>
            </div>
            <CardDescription className="text-slate-600 dark:text-slate-300 print:text-slate-600">
              Your confirmed ticket details are shown below.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 pt-6 print:space-y-4">
            {loading ? (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading ticket details...
              </div>
            ) : error ? (
              <div className="space-y-4 rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
                <p className="text-lg font-semibold">Ticket not found</p>
                <p className="text-sm">{error}</p>
                <Button
                  asChild
                  className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Link href="/">Go back and search again</Link>
                </Button>
              </div>
            ) : ticket ? (
              <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-4">
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-5 dark:border-emerald-900/50 dark:bg-emerald-900/20 print:border-slate-300 print:bg-slate-50">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300 print:text-slate-600">
                          Booking reference
                        </p>
                        <p className="mt-1 text-3xl font-semibold text-slate-950 dark:text-white print:text-slate-900">
                          #{ticket.booking.id}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-emerald-950/60 print:border print:border-slate-300 print:bg-white">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          Status
                        </p>
                        <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300 print:text-slate-900">
                          <CheckCircle2 className="h-4 w-4" />
                          {ticket.booking.booking_status}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-emerald-950/50 print:bg-slate-100">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Route
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white print:text-slate-900">
                        {ticket.booking.source_city} to{" "}
                        {ticket.booking.destination_city}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-emerald-950/50 print:bg-slate-100">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Bus
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white print:text-slate-900">
                        {ticket.booking.bus_number} • {ticket.booking.bus_type}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-emerald-950/50 print:bg-slate-100">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Departure
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white print:text-slate-900">
                        {formatDateTime(ticket.booking.departure_time)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-emerald-950/50 print:bg-slate-100">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Arrival
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white print:text-slate-900">
                        {formatDateTime(ticket.booking.arrival_time)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-dashed border-emerald-200 bg-white p-5 dark:border-emerald-900/50 dark:bg-emerald-950/50 print:border-slate-300 print:bg-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300 print:text-slate-600">
                      Seats
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {ticket.seats.map((seat) => (
                        <span
                          key={seat.seat_number}
                          className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200 print:border print:border-slate-300 print:bg-white print:text-slate-900"
                        >
                          {seat.seat_number}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/40 print:border-slate-300 print:bg-white">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300 print:text-slate-600">
                      Fare summary
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white print:text-slate-900">
                      Payment details
                    </h3>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-emerald-950/60 print:bg-slate-100">
                      <span className="text-slate-600 dark:text-slate-300">
                        Booked on
                      </span>
                      <span className="font-medium text-slate-950 dark:text-white print:text-slate-900">
                        {formatDateTime(ticket.booking.booking_time)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-emerald-950/60 print:bg-slate-100">
                      <span className="text-slate-600 dark:text-slate-300">
                        Seats
                      </span>
                      <span className="font-medium text-slate-950 dark:text-white print:text-slate-900">
                        {ticket.seats.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-emerald-950/60 print:bg-slate-100">
                      <span className="text-slate-600 dark:text-slate-300">
                        Payment status
                      </span>
                      <span className="font-medium text-slate-950 dark:text-white print:text-slate-900">
                        {ticket.booking.payment_status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3 text-base dark:bg-emerald-900/30 print:bg-slate-100">
                      <span className="font-medium text-emerald-700 dark:text-emerald-300 print:text-slate-700">
                        Total paid
                      </span>
                      <span className="text-lg font-semibold text-emerald-700 dark:text-emerald-300 print:text-slate-900">
                        ৳{ticket.booking.total_amount}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200 print:border-slate-300 print:bg-slate-50 print:text-slate-700">
                    <div className="flex items-center gap-2 font-medium">
                      <CalendarDays className="h-4 w-4" />
                      {ticket.booking.bus_type} service
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Bus className="h-4 w-4" />
                      {ticket.booking.operator_name || "Bus operator"}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Clock3 className="h-4 w-4" />
                      Schedule: {ticket.booking.schedule_status}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <PrintReceipt ticket={ticket} user={user} />
      </div>
    </main>
  );
}
