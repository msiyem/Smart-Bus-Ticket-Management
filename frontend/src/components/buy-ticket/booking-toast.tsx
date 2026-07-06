import React from "react";

import { Button } from "@/components/ui/button";

type BookingToastProps = {
  visible: boolean;
  bookingId: number | null;
  onViewTicket: () => void;
  onClose: () => void;
};

export function BookingToast({
  visible,
  bookingId,
  onViewTicket,
  onClose,
}: BookingToastProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-50 w-80 rounded-2xl border border-emerald-200 bg-white p-3 shadow-lg dark:border-emerald-900/50 dark:bg-emerald-950/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            Booking created
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            Reference #{bookingId}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={onViewTicket}
            className="rounded-md bg-emerald-600 text-white"
          >
            View ticket
          </Button>
          <Button variant="ghost" onClick={onClose} className="text-slate-600">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
