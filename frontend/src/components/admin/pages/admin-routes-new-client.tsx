"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { createRouteFormAction } from "@/action/route.action";
import {
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/admin-page-primitives";
import { CitySelect } from "@/components/admin/city-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { createRouteSchema } from "@/lib/validations/route";

type CreateRouteInput = z.input<typeof createRouteSchema>;
type CreateRouteOutput = z.output<typeof createRouteSchema>;

export default function AdminRoutesNewClient() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const methods = useForm<CreateRouteInput, unknown, CreateRouteOutput>({
    resolver: zodResolver(createRouteSchema),
    defaultValues: {
      source_city: "",
      destination_city: "",
      distance_km: 0 as unknown as number,
      estimated_duration: 0 as unknown as number,
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = methods;

  // Track source city so we can hide it from the destination dropdown
  // (prevents selecting the same city for both endpoints at the UI level).
  const sourceCity = watch("source_city");

  // If the user picks a source that conflicts with an already-selected
  // destination, clear destination so they must choose again — otherwise the
  // form would hold an invalid pair that only fails at submit time.
  //
  // We read destination_city via getValues (not watch) inside the effect to
  // avoid subscribing to it as a parent-level dependency; this prevents the
  // effect from re-firing every time destination updates, which would otherwise
  // contribute to render churn in the dev server.
  React.useEffect(() => {
    if (!sourceCity) return;
    const dest = methods.getValues("destination_city");
    if (dest && dest.toLowerCase() === sourceCity.toLowerCase()) {
      methods.setValue("destination_city", "", { shouldValidate: true });
    }
    // We intentionally only depend on sourceCity — destination is read on
    // demand so a setValue here doesn't immediately retrigger the effect.
  }, [sourceCity, methods]);

  const onSubmit = async (values: CreateRouteOutput) => {
    setSubmitting(true);
    const formData = new FormData();
    formData.append("source_city", values.source_city);
    formData.append("destination_city", values.destination_city);
    formData.append("distance_km", String(values.distance_km));
    formData.append("estimated_duration", String(values.estimated_duration));

    const result = await createRouteFormAction(undefined, formData);
    if (!result.success) {
      toast.error(result.message || "Failed to create route");
      setSubmitting(false);
      return;
    }

    toast.success("Route created successfully");
    setSubmitting(false);
    router.replace("/routes");
  };

  return (
    <div className="space-y-6">
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/40"
        >
          <Link href="/routes">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to routes
          </Link>
        </Button>
      </div>

      <AdminPageHeader
        title="Create Route"
        description="Add a city-to-city route. Set distance and estimated duration for trip planning."
      />

      <div className="mx-auto max-w-2xl">
        <AdminPanel
          title="New route"
          description="Add source, destination, distance, and duration."
        >
          <FormProvider {...methods}>
            <form
              className="space-y-3"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <CitySelect
                name="source_city"
                label="Source city"
                placeholder="Select origin city"
              />
              <CitySelect
                name="destination_city"
                label="Destination city"
                placeholder="Select destination city"
                exclude={sourceCity || undefined}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Input
                    type="number"
                    {...register("distance_km")}
                    placeholder="Distance (km)"
                    min={1}
                  />
                  {errors.distance_km && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.distance_km.message}
                    </p>
                  )}
                </div>
                <div>
                  <Input
                    type="number"
                    {...register("estimated_duration")}
                    placeholder="Duration (minutes)"
                    min={1}
                  />
                  {errors.estimated_duration && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.estimated_duration.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  asChild
                  variant="ghost"
                  type="button"
                  className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/40"
                >
                  <Link href="/routes">Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {submitting ? "Creating route..." : "Create route"}
                </Button>
              </div>
            </form>
          </FormProvider>
        </AdminPanel>
      </div>
    </div>
  );
}