"use client";

import * as React from "react";

import { Check, ChevronsUpDown, Map, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type CityComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  cities: string[];
  placeholder?: string;
  icon?: React.ReactNode;
  recentStorageKey: string;

  excludeCity?: string;
};

export function CityCombobox({
  value,
  onChange,
  cities,
  placeholder,
  icon,
  recentStorageKey,
  excludeCity,
}: CityComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const [search, setSearch] = React.useState("");

  const [recentCities, setRecentCities] = React.useState<string[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const stored = localStorage.getItem(recentStorageKey);

    return stored ? JSON.parse(stored) : [];
  });

  const filteredCities = cities.filter(
    (city) =>
      city !== excludeCity && city.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredRecentCities = recentCities.filter(
    (city) => city !== excludeCity,
  );

  const suggestions =
    search.trim() === "" ? filteredRecentCities : filteredCities;

  const saveRecentCity = (city: string) => {
    const updated = [
      city,
      ...recentCities.filter((item) => item !== city),
    ].slice(0, 5);

    setRecentCities(updated);

    localStorage.setItem(recentStorageKey, JSON.stringify(updated));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className="
            h-12 w-full justify-between rounded-2xl
            border border-slate-200
            bg-slate-200/80
            px-3 font-bold

            hover:bg-emerald-50/70


            dark:border-emerald-800
            dark:bg-slate-950/50
          "
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {icon}

            <span className="truncate text-slate-700 dark:text-slate-200">
              {value || placeholder}
            </span>
          </div>

          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        avoidCollisions={false}
        sideOffset={8}
        className={`w-(--radix-popover-trigger-width) p-0 -mt-5 rounded-t-sm border border-t-0  ring-0 shadow-lg backdrop-blur-3xl  `}
      >
        <Command shouldFilter={false} className="border-0">
          <CommandInput
            placeholder="Search city..."
            value={search}
            onValueChange={setSearch}
          />

          <CommandList className=" lg:max-h-66 overflow-y-auto">
            <CommandEmpty>No city found.</CommandEmpty>

            <CommandGroup
              heading={search.trim() === "" ? "Recent Searches" : "Cities"}
            >
              {suggestions.map((city) => (
                <CommandItem
                  key={city}
                  value={city}
                  onSelect={(currentValue) => {
                    onChange(currentValue);

                    saveRecentCity(currentValue);

                    setOpen(false);

                    setSearch("");
                  }}
                  className={cn(
                    `
                    group relative flex cursor-pointer items-center
                    gap-2 rounded-xl px-3 py-2.5
                    text-sm font-medium text-slate-700
                    transition-all duration-200

                    hover:bg-emerald-50/70
                    hover:text-emerald-700

                    aria-selected:bg-emerald-50/70
                    aria-selected:text-emerald-700

                    dark:text-slate-200
                    dark:hover:bg-emerald-900/20
                    dark:hover:text-emerald-200

                    dark:aria-selected:bg-emerald-900/30
                    dark:aria-selected:text-emerald-100
                  `,
                    value === city &&
                      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100",
                  )}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 transition-opacity",
                      value === city ? "opacity-100" : "opacity-0",
                    )}
                  />

                  <MapPin className={cn(
                      "h-4 w-4 opacity-60",
                      value === city ? "stroke-emerald-700 stroke-3" : "",
                    )} />

                  <span className="truncate">{city}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
