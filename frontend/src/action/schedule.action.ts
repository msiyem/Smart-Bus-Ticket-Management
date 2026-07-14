"use server";

import { serverRequest } from "@/action/server-request.action";
import type { TripSearchResult, ScheduleTemplate } from "@/types/booking";

type ActionResult<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
};

type TripSearchResponse = ActionResult<TripSearchResult[]> & {
  date?: string;
};

type ListResponse = ActionResult<ScheduleTemplate[]>;
type ItemResponse = ActionResult<ScheduleTemplate>;

export type SearchTripsParams = {
  source: string;
  destination: string;
  date: string; // YYYY-MM-DD
};

export const searchTripsAction = async (
  params: SearchTripsParams,
): Promise<TripSearchResponse> => {
  try {
    const query = new URLSearchParams(params).toString();
    return await serverRequest<TripSearchResponse>(
      `schedules/search?${query}`,
      { method: "GET" },
    );
  } catch (error) {
    console.error("Error searching trips:", error);
    return { success: false, message: "Failed to search trips" };
  }
};

export const searchSchedules = searchTripsAction;

export const listSchedules = async (): Promise<ListResponse> => {
  try {
    return await serverRequest<ListResponse>("schedules", {
      method: "GET",
      auth: true,
    });
  } catch (error) {
    console.error("Error listing schedules:", error);
    return { success: false, message: "Failed to list schedules" };
  }
};

export const getSchedule = async (id: number): Promise<ItemResponse> => {
  try {
    return await serverRequest<ItemResponse>(`schedules/${id}`, {
      method: "GET",
      auth: true,
    });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return { success: false, message: "Failed to fetch schedule" };
  }
};

export const updateSchedule = async (
  id: number,
  patch: Partial<ScheduleTemplate>,
): Promise<ActionResult<{ scheduleId?: number }>> => {
  try {
    return await serverRequest<ActionResult<{ scheduleId?: number }>>(
      `schedules/${id}`,
      {
        method: "PUT",
        auth: true,
        body: JSON.stringify(patch),
      },
    );
  } catch (error) {
    console.error("Error updating schedule:", error);
    return { success: false, message: "Failed to update schedule" };
  }
};

export const deleteSchedule = async (id: number): Promise<ActionResult> => {
  try {
    return await serverRequest<ActionResult>(`schedules/${id}`, {
      method: "DELETE",
      auth: true,
    });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return { success: false, message: "Failed to delete schedule" };
  }
};
