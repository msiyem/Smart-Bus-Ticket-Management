"use server";
import { serverRequest } from "@/action/server-request.action";
import { parseFormData, formatZodErrors } from "@/action/form-data";
import { createRouteSchema, CreateRouteData } from "@/lib/validations/route";
import type { Route } from "@/lib/types";

type FormActionResult<T = unknown> =
  | { success: true; data?: T }
  | { success: false; message: string; fieldErrors?: Record<string, string> };

function toFieldErrors(error: unknown): Record<string, string> | undefined {
  if (error && typeof error === "object" && "issues" in (error as Record<string, unknown>)) {
    const issues = (error as { issues: { path: (string | number)[]; message: string }[] }).issues;
    const out: Record<string, string> = {};
    for (const issue of issues) {
      const key = issue.path.join(".");
      if (key && !out[key]) out[key] = issue.message;
    }
    return out;
  }
  return undefined;
}

type ActionResult = {
  success: boolean;
  message?: string;
};

type RoutesResult = ActionResult & {
  routes: Route[];
};

export const createRoute = async (payload: {
  source_city: string;
  destination_city: string;
  distance_km: number;
  estimated_duration: number;
}): Promise<ActionResult> => {
  try {
    return await serverRequest<ActionResult>("routes", {
      method: "POST",
      auth: true,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Error creating route:", error);
    return { success: false, message: "Failed to create route" };
  }
};

export const getAllRoutes = async (): Promise<RoutesResult> => {
  try {
    return await serverRequest<RoutesResult>("routes", {
      method: "GET",
    });
  } catch (error) {
    console.error("Error fetching routes:", error);
    return { success: false, message: "Failed to fetch routes", routes: [] };
  }
};

export const createRouteFormAction = async (
  _prev: FormActionResult | undefined,
  formData: FormData,
): Promise<FormActionResult> => {
  let parsed: CreateRouteData;
  try {
    parsed = (await parseFormData(
      formData,
      createRouteSchema,
    )) as CreateRouteData;
  } catch (error) {
    const zodError = error as import("zod").ZodError;
    return {
      success: false,
      message: formatZodErrors(zodError),
      fieldErrors: toFieldErrors(zodError),
    };
  }

  const result = await createRoute({
    source_city: parsed.source_city,
    destination_city: parsed.destination_city,
    distance_km: parsed.distance_km,
    estimated_duration: parsed.estimated_duration,
  });
  if (!result.success) {
    return { success: false, message: result.message || "Failed to create route" };
  }
  return { success: true, data: result };
};
