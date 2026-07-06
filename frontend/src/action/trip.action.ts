"use server";

import { serverRequest } from "@/action/server-request.action";
import type { Trip } from "@/lib/types";

type ActionResult<T = null> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type ListTripsParams = {
  schedule_id?: number;
  date?: string;
  status?: "SCHEDULED" | "CANCELLED" | "COMPLETED";
};

function buildQuery(params: ListTripsParams | undefined): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  if (params.schedule_id)
    sp.set("schedule_id", String(params.schedule_id));
  if (params.date) sp.set("date", params.date);
  if (params.status) sp.set("status", params.status);
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export const listTripsAction = async (
  params?: ListTripsParams,
): Promise<ActionResult<Trip[]>> => {
  try {
    return await serverRequest<ActionResult<Trip[]>>(
      `trips${buildQuery(params)}`,
      { method: "GET", auth: true },
    );
  } catch (error) {
    console.error("Error listing trips:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to list trips",
    };
  }
};

export const getTripAction = async (
  tripId: number,
): Promise<ActionResult<Trip>> => {
  try {
    return await serverRequest<ActionResult<Trip>>(`trips/${tripId}`, {
      method: "GET",
      auth: true,
    });
  } catch (error) {
    console.error("Error fetching trip:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch trip",
    };
  }
};

export type UpdateTripPayload = {
  fare?: number;
  status?: "SCHEDULED" | "CANCELLED" | "COMPLETED";
  actual_departure_time?: string | null;
  actual_arrival_time?: string | null;
  cancelled_reason?: string | null;
};

export const updateTripAction = async (
  tripId: number,
  payload: UpdateTripPayload,
): Promise<ActionResult<{ tripId: number }>> => {
  try {
    return await serverRequest<ActionResult<{ tripId: number }>>(
      `trips/${tripId}`,
      { method: "PUT", auth: true, body: JSON.stringify(payload) },
    );
  } catch (error) {
    console.error("Error updating trip:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update trip",
    };
  }
};

export const cancelTripAction = async (
  tripId: number,
  cancelledReason?: string,
): Promise<ActionResult<{ tripId: number }>> => {
  try {
    return await serverRequest<ActionResult<{ tripId: number }>>(
      `trips/${tripId}/cancel`,
      {
        method: "POST",
        auth: true,
        body: JSON.stringify({ cancelled_reason: cancelledReason ?? null }),
      },
    );
  } catch (error) {
    console.error("Error cancelling trip:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to cancel trip",
    };
  }
};

export const deleteTripAction = async (
  tripId: number,
): Promise<ActionResult<{ tripId: number }>> => {
  try {
    return await serverRequest<ActionResult<{ tripId: number }>>(
      `trips/${tripId}`,
      { method: "DELETE", auth: true },
    );
  } catch (error) {
    console.error("Error deleting trip:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete trip",
    };
  }
};
