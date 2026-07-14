"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function AdminDayBookingsClient({
  initialDate,
  initialSchedules,
}: {
  initialDate: string;
  initialSchedules: any[];
}) {
  const router = useRouter();
  const [date, setDate] = React.useState(initialDate);

  const go = (d: string) => {
    router.push(`/day-bookings?date=${encodeURIComponent(d)}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Day bookings</h2>
          <p className="text-sm text-slate-500">
            Buses and bookings for the chosen date
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded border px-2 py-1"
          />
          <button
            className="rounded bg-emerald-600 px-3 py-1 text-white"
            onClick={() => go(date)}
          >
            Go
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {initialSchedules.length === 0 ? (
          <div className="rounded border p-4">
            No schedules found for{" "}
            {new Date(date).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        ) : (
          initialSchedules.map((s) => (
            <div key={s.trip.id} className="rounded border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-500">
                    {s.trip.source_city} → {s.trip.destination_city}
                  </div>
                  <div className="text-lg font-semibold">
                    {s.trip.bus.bus_number} — {s.trip.bus.bus_type}
                  </div>
                  <div className="text-sm text-slate-500">
                    Departure:{" "}
                    {new Date(s.trip.departure_time).toLocaleString()}
                  </div>
                </div>
                <div className="text-right text-sm text-slate-600">
                  Fare: ৳{s.trip.fare}
                </div>
              </div>

              <div className="mt-3">
                <h4 className="font-medium">Bookings</h4>
                {s.bookings.length === 0 ? (
                  <div className="text-sm text-slate-500">No bookings yet</div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {s.bookings.map((b: any) => (
                      <div key={b.id} className="rounded border p-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">
                              Booking #{b.id} — {b.booking_status}
                            </div>
                            <div className="text-sm text-slate-600">
                              By: {b.user_name || b.user_email || "Unknown"}
                            </div>
                            <div className="text-sm text-slate-600">
                              Seats:{" "}
                              {b.seats
                                .map((ss: any) => ss.seat_number)
                                .join(", ")}
                            </div>
                          </div>
                          <div className="text-sm text-slate-700">
                            Total: ৳{b.total_amount}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
