"use client";

import * as React from "react";

import { format } from "date-fns";
import { CalendarIcon, Check, Clock3 } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DateTimePickerProps = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  className?: string;
};

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date & time",
  disabled,
  minDate,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const today = new Date();

  const selectedDate = value ? new Date(value) : undefined;

  const updateDateTime = (
    date: Date | undefined,
    hours?: string,
    minutes?: string,
  ) => {
    if (!date) return;

    const nextDate = new Date(date);

    if (hours !== undefined) {
      nextDate.setHours(Number(hours));
    }

    if (minutes !== undefined) {
      nextDate.setMinutes(Number(minutes));
    }

    onChange(format(nextDate, "yyyy-MM-dd'T'HH:mm"));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={`
            h-12 w-full justify-start rounded-2xl
            border-slate-200 bg-slate-200 text-slate-700
            pl-3 text-left font-medium
            hover:bg-emerald-50/70

            dark:border-emerald-800
            dark:bg-slate-950/50
            dark:hover:bg-emerald-900/40

            ${className || ""}
          `}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />

          {selectedDate ? (
            format(selectedDate, "PPP • hh:mm a")
          ) : (
            <span className="text-slate-500">
              {placeholder}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="
          w-auto rounded-2xl border
          border-emerald-200 p-0 shadow-lg

          dark:border-emerald-800
        "
      >
        <div className="p-2">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (!date) return;

              const currentHours = selectedDate
                ? selectedDate.getHours()
                : 0;

              const currentMinutes = selectedDate
                ? selectedDate.getMinutes()
                : 0;

              date.setHours(currentHours);
              date.setMinutes(currentMinutes);

              onChange(format(date, "yyyy-MM-dd'T'HH:mm"));
            }}
            disabled={(date) => {
              if (!minDate) return false;

              return (
                date <
                new Date(
                  minDate.getFullYear(),
                  minDate.getMonth(),
                  minDate.getDate(),
                )
              );
            }}
            className="rounded-xl p-1.5"
            classNames={{
              root: "shadow-md p-2",

              weekday:
                "w-7.5 text-[0.72rem] font-semibold text-emerald-700 dark:text-emerald-300",

              month_caption:
                "text-center text-sm font-semibold text-emerald-700 dark:text-emerald-300",

              chevron:
                "rounded-sm fill-emerald-500 text-emerald-500 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-900/50",

              today:
                "font-bold border border-emerald-200 text-emerald-700 dark:text-emerald-300",

              selected:
                "rounded-md border border-emerald-500 bg-transparent font-semibold text-emerald-600",

              day_button:
                "relative h-6 w-6 rounded-md text-sm transition-all aria-selected:bg-transparent aria-selected:text-foreground",

              button_previous:
                "rounded-sm p-1 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 active:ring dark:hover:bg-emerald-900 dark:hover:text-emerald-300",

              button_next:
                "rounded-sm p-1 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 active:ring dark:hover:bg-emerald-900 dark:hover:text-emerald-300",
            }}
            components={{
              DayButton: ({
                day,
                modifiers,
                ...props
              }) => {
                const isToday =
                  day.date.toDateString() ===
                  today.toDateString();

                const shouldShowTick =
                  modifiers.selected ||
                  (!selectedDate && isToday);

                return (
                  <button
                    {...props}
                    className={props.className}
                  >
                    {day.date.getDate()}

                    {shouldShowTick && (
                      <span
                        className="
                          absolute -bottom-1 -right-px
                          flex h-3.5 w-3.5 items-center justify-center
                          rounded-tl-xl rounded-br-md
                          bg-emerald-500 dark:bg-emerald-600
                        "
                      >
                        <Check className="mt-0.5 h-2.5 w-2.5 text-white stroke-3" />
                      </span>
                    )}
                  </button>
                );
              },
            }}
          />

          <div
            className="
              mt-2 flex items-center gap-2
              rounded-xl border border-emerald-100
              bg-slate-50 p-3

              dark:border-emerald-900
              dark:bg-slate-900
            "
          >
            <Clock3 className="h-4 w-4 text-emerald-500" />

            <input
              type="time"
              value={
                selectedDate
                  ? format(selectedDate, "HH:mm")
                  : ""
              }
              onChange={(event) => {
                const [hours, minutes] =
                  event.target.value.split(":");

                updateDateTime(
                  selectedDate || new Date(),
                  hours,
                  minutes,
                );
              }}
              className="
                rounded-lg border border-emerald-200
                bg-white px-3 py-1.5 text-sm
                outline-none transition-all

                focus:border-emerald-500
                focus:ring-2 focus:ring-emerald-200

                dark:border-emerald-800
                dark:bg-slate-950
              "
            />

            <Button
              size="sm"
              className="ml-auto bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}