"use server";
import { serverRequest } from "@/action/server-request.action";
import { parseFormData, formatZodErrors } from "@/action/form-data";
import { createBusSchema, CreateBusData } from "@/lib/validations/bus";
import type { Bus } from "@/lib/types";

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

type ActionResult = { success: boolean; message?: string };

type CreateBusResponse = ActionResult & { busId?: number };

type GetBusesResponse = ActionResult & { buses?: Bus[] };

export const createBus = async (payload: {
  bus_number: string;
  bus_type: string;
  capacity: number;
  operator_name: string;
}): Promise<CreateBusResponse> => {
  try {
    return await serverRequest<CreateBusResponse>("buses", {
      method: "POST",
      auth: true,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Error creating bus:", error);
    return { success: false, message: "Failed to create bus" };
  }
};

export const getAllBuses = async (): Promise<GetBusesResponse> => {
  try {
    return await serverRequest<GetBusesResponse>("buses", {
      method: "GET",
      auth: true,
    });
  } catch (error) {
    console.error("Error fetching buses:", error);
    return { success: false, message: "Failed to fetch buses" };
  }
};

export const createBusFormAction = async (
  _prev: FormActionResult<CreateBusResponse> | undefined,
  formData: FormData,
): Promise<FormActionResult<CreateBusResponse>> => {
  let parsed: CreateBusData;
  try {
    parsed = (await parseFormData(formData, createBusSchema)) as CreateBusData;
  } catch (error) {
    const zodError = error as import("zod").ZodError;
    return {
      success: false,
      message: formatZodErrors(zodError),
      fieldErrors: toFieldErrors(zodError),
    };
  }

  const result = await createBus({
    bus_number: parsed.bus_number,
    bus_type: parsed.bus_type,
    capacity: parsed.capacity,
    operator_name: parsed.operator_name,
  });
  if (!result.success) {
    return { success: false, message: result.message || "Failed to create bus" };
  }
  return { success: true, data: result };
};
