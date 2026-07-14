"use server";
import { serverRequest } from "@/action/server-request.action";
import { parseFormData, formatZodErrors } from "@/action/form-data";
import {
  createScheduleSchema,
  updateScheduleSchema,
  offDaySchema,
  CreateScheduleData,
  UpdateScheduleData,
  OffDayData,
} from "@/lib/validations/schedule";

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

type CreateScheduleResponse = ActionResult & { scheduleId?: number };

export const createSchedule = async (payload: {
  route_id: number;
  bus_id: number;
  departure_time: string;
  arrival_time: string;
  fare: number;
  repeat_days?: number;
}): Promise<CreateScheduleResponse> => {
  try {
    return await serverRequest<CreateScheduleResponse>("schedules", {
      method: "POST",
      auth: true,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return { success: false, message: "Failed to create schedule" };
  }
};

export const createScheduleFormAction = async (
  _prev: FormActionResult<CreateScheduleResponse> | undefined,
  formData: FormData,
): Promise<FormActionResult<CreateScheduleResponse>> => {
  let parsed: CreateScheduleData;
  try {
    parsed = (await parseFormData(
      formData,
      createScheduleSchema,
    )) as CreateScheduleData;
  } catch (error) {
    const zodError = error as import("zod").ZodError;
    return {
      success: false,
      message: formatZodErrors(zodError),
      fieldErrors: toFieldErrors(zodError),
    };
  }

  const result = await createSchedule({
    route_id: parsed.route_id,
    bus_id: parsed.bus_id,
    departure_time: parsed.departure_time,
    arrival_time: parsed.arrival_time,
    fare: parsed.fare,
    repeat_days: parsed.repeat_days,
  });
  if (!result.success) {
    return { success: false, message: result.message || "Failed to create schedule" };
  }
  return { success: true, data: result };
};

export const updateScheduleFormAction = async (
  scheduleId: number,
  _prev: FormActionResult | undefined,
  formData: FormData,
): Promise<FormActionResult> => {
  let parsed: UpdateScheduleData;
  try {
    parsed = (await parseFormData(
      formData,
      updateScheduleSchema,
    )) as UpdateScheduleData;
  } catch (error) {
    const zodError = error as import("zod").ZodError;
    return {
      success: false,
      message: formatZodErrors(zodError),
      fieldErrors: toFieldErrors(zodError),
    };
  }

  try {
    const result = await serverRequest<{
      success: boolean;
      message?: string;
    }>(`schedules/${scheduleId}`, {
      method: "PUT",
      auth: true,
      body: JSON.stringify(parsed),
    });
    if (!result.success) {
      return { success: false, message: result.message || "Failed to update schedule" };
    }
    return { success: true };
  } catch (error) {
    console.error("Error updating schedule:", error);
    return { success: false, message: "Failed to update schedule" };
  }
};

export const deleteScheduleFormAction = async (
  scheduleId: number,
): Promise<FormActionResult> => {
  try {
    const result = await serverRequest<{
      success: boolean;
      message?: string;
    }>(`schedules/${scheduleId}`, {
      method: "DELETE",
      auth: true,
    });
    if (!result.success) {
      return { success: false, message: result.message || "Failed to delete schedule" };
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return { success: false, message: "Failed to delete schedule" };
  }
};

// Bit positions matching the backend (Mon=0, Sun=6).
const WEEKDAY_BITS = [1, 2, 4, 8, 16, 32, 64];

const weekdayBitForDate = (yyyyMmDd: string): number => {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  const jsDay = utc.getUTCDay();
  const position = jsDay === 0 ? 6 : jsDay - 1;
  return WEEKDAY_BITS[position];
};

export const getSchedule = async (
  id: number,
): Promise<{ success: boolean; repeat_days?: number; message?: string }> => {
  try {
    const result = await serverRequest<{
      success: boolean;
      data?: { repeat_days: number };
      message?: string;
    }>(`schedules/${id}`, { method: "GET", auth: true });
    if (!result.success || !result.data) {
      return { success: false, message: result.message || "Failed to fetch schedule" };
    }
    return { success: true, repeat_days: result.data.repeat_days };
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return { success: false, message: "Failed to fetch schedule" };
  }
};

export const toggleOffDayFormAction = async (
  _prev: FormActionResult | undefined,
  formData: FormData,
): Promise<FormActionResult> => {
  let parsed: OffDayData;
  try {
    parsed = (await parseFormData(
      formData,
      offDaySchema,
    )) as OffDayData;
  } catch (error) {
    const zodError = error as import("zod").ZodError;
    return {
      success: false,
      message: formatZodErrors(zodError),
      fieldErrors: toFieldErrors(zodError),
    };
  }

  const current = await getSchedule(parsed.schedule_id);
  if (!current.success || current.repeat_days === undefined) {
    return { success: false, message: current.message || "Schedule not found" };
  }

  const bit = weekdayBitForDate(parsed.date);
  const next =
    parsed.mode === "off"
      ? current.repeat_days & ~bit // remove this weekday
      : current.repeat_days | bit; // add it back

  try {
    const result = await serverRequest<{
      success: boolean;
      message?: string;
    }>(`schedules/${parsed.schedule_id}`, {
      method: "PUT",
      auth: true,
      body: JSON.stringify({ repeat_days: next }),
    });
    if (!result.success) {
      return { success: false, message: result.message || "Failed to update schedule" };
    }
    return { success: true };
  } catch (error) {
    console.error("Error toggling off day:", error);
    return { success: false, message: "Failed to update schedule" };
  }
};
