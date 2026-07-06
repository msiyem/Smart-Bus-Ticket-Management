"use client";

import React from "react";
import Image from "next/image";
import { CalendarDays, Bus, Clock3, Ticket } from "lucide-react";

import type { BookingTicketDetails } from "@/lib/types";

import ticketBg from "../../../public/ticket-bg.png";

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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(amount);
};

type Props = {
  ticket: BookingTicketDetails | null;
};

export default function PrintReceipt({ ticket, user }: Props & { user: any }) {
  if (!ticket) return null;

  return (
    <section className="hidden print:block print:w-full print:text-slate-950">
      <div className="mx-auto max-w-[780px] overflow-hidden rounded-none border border-slate-300 bg-white p-6 relative [print-color-adjust:exact]">
        <Image
          src={ticketBg}
          alt=""
          aria-hidden
          priority
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-120 w-120 -translate-x-1/2 -translate-y-1/2 rounded-full object-cover opacity-4 grayscale"
        />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-300 pb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500">
                TicketMama
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                Official Travel Receipt
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Booking ticket confirmation
              </p>
            </div>

            <div className="min-w-40 rounded border border-slate-300 px-4 py-3 text-right">
              <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">
                Booking reference
              </p>

              <p className="mt-1 text-2xl font-semibold text-slate-950">
                #{ticket.booking.id}
              </p>

              <p className="mt-1 text-xs capitalize text-slate-500">
                {ticket.booking.booking_status}
              </p>

              {user?.email ? (
                <p className="mt-2 text-xs text-slate-600 break-words">
                  {user.email}
                </p>
              ) : null}
            </div>
          </div>

          {/* Trip Info */}
          <div className="mt-5 grid gap-3 text-sm print:grid-cols-2">
            <div className="rounded border border-slate-300 p-4">
              <div className="flex items-center gap-2 text-slate-500">
                <Ticket className="h-4 w-4" />

                <p className="text-[10px] uppercase tracking-[0.22em]">
                  Passenger route
                </p>
              </div>

              <p className="mt-2 text-base font-medium text-slate-950">
                {ticket.booking.source_city} to{" "}
                {ticket.booking.destination_city}
              </p>
            </div>

            <div className="rounded border border-slate-300 p-4">
              <div className="flex items-center gap-2 text-slate-500">
                <Bus className="h-4 w-4" />

                <p className="text-[10px] uppercase tracking-[0.22em]">
                  Bus details
                </p>
              </div>

              <p className="mt-2 text-base font-medium text-slate-950">
                {ticket.booking.bus_number} • {ticket.booking.bus_type}
              </p>
            </div>

            <div className="rounded border border-slate-300 p-4">
              <div className="flex items-center gap-2 text-slate-500">
                <CalendarDays className="h-4 w-4" />

                <p className="text-[10px] uppercase tracking-[0.22em]">
                  Departure
                </p>
              </div>

              <p className="mt-2 text-base font-medium text-slate-950">
                {formatDateTime(ticket.booking.departure_time)}
              </p>
            </div>

            <div className="rounded border border-slate-300 p-4">
              <div className="flex items-center gap-2 text-slate-500">
                <Clock3 className="h-4 w-4" />

                <p className="text-[10px] uppercase tracking-[0.22em]">
                  Arrival
                </p>
              </div>

              <p className="mt-2 text-base font-medium text-slate-950">
                {formatDateTime(ticket.booking.arrival_time)}
              </p>
            </div>
          </div>

          {/* Ticket Separator */}
          <div className="relative my-5 border-t border-dashed border-slate-300">
            <div className="absolute -left-8 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-slate-300 bg-white" />
            <div className="absolute -right-8 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-slate-300 bg-white" />
          </div>

          {/* Seat + Fare */}
          <div className="grid gap-4 print:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded border border-slate-300 p-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                Seat numbers
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {ticket.seats?.map((seat) => (
                  <span
                    key={seat.seat_number}
                    className="rounded border border-slate-300 px-3 py-1 text-sm font-medium text-slate-950"
                  >
                    {seat.seat_number}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded border border-slate-300 p-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                Fare summary
              </p>

              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Booked on</span>

                  <span className="font-medium text-slate-950">
                    {formatDateTime(ticket.booking.booking_time)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Seats</span>

                  <span className="font-medium text-slate-950">
                    {ticket.seats?.length || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Payment</span>

                  <span className="font-medium capitalize text-slate-950">
                    {ticket.booking.payment_status}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-300 pt-2 text-base">
                  <span className="font-semibold text-slate-950">
                    Total paid
                  </span>

                  <span className="font-semibold text-slate-950">
                    {formatCurrency(ticket.booking.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between border-t border-slate-300 pt-3 text-xs text-slate-500">
            <span>Schedule: {ticket.booking.schedule_status}</span>

            <span>
              {ticket.booking.operator_name || "TicketMama Transport"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
