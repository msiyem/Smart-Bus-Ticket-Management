"use client";

import * as React from "react";
import {
  useFormContext,
  useFormState,
  useWatch,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { MapPin } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BANGLADESH_CITIES } from "@/constants/cities";

interface CitySelectProps<T extends FieldValues> {
  /** react-hook-form field name — typed against the form's FieldValues. */
  name: Path<T>;
  /** Visible label rendered above the trigger. */
  label: string;
  /** A single city to hide from the dropdown (e.g. the currently-picked source). */
  exclude?: string;
  /** Placeholder shown when nothing is selected. */
  placeholder?: string;
}

/**
 * Shadcn-backed dropdown for selecting a city from BANGLADESH_CITIES,
 * wired to react-hook-form via `useFormContext`.
 *
 * Must be rendered inside a <FormProvider> that wraps a RHF `useForm` over a
 * schema whose fields are string-typed.
 */
export function CitySelect<T extends FieldValues>({
  name,
  label,
  exclude,
  placeholder = "Select a city",
}: CitySelectProps<T>) {
  const { control, setValue } = useFormContext<T>();

  // Field-scoped error subscription so unrelated field errors don't re-render us.
  const { errors } = useFormState({ control, name });
  const fieldError = errors[name];

  const value = useWatch({ control, name }) as string | undefined;

  const options = React.useMemo(
    () =>
      exclude
        ? BANGLADESH_CITIES.filter((city) => city !== exclude)
        : BANGLADESH_CITIES,
    [exclude],
  );

  // Shadcn Select treats `undefined` as "no value"; using `""` is reserved for
  // empty-value items in some Radix versions, so we normalize defensively.
  // When the currently selected value falls out of `options` (e.g. user changed
  // the source so the destination is now hidden), we render the placeholder.
  const safeValue: string | undefined =
    value && options.includes(value) ? value : undefined;

  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" /> {label}
      </div>
      <Select
        value={safeValue}
        onValueChange={(next) =>
          setValue(name, next as never, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
          })
        }
      >
        <SelectTrigger className="mt-1">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map((city) => (
            <SelectItem key={city} value={city}>
              {city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {fieldError?.message && (
        <p className="mt-1 text-xs text-red-500">{String(fieldError.message)}</p>
      )}
    </div>
  );
}

