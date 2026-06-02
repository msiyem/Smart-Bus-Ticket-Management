"use server";

import { serverRequest } from "@/action/server-request.action";

type ActionResult = {
  success: boolean;
  message?: string;
};

type ScheduleSearchResult = {
  id: number;
  departure_time: string;
  arrival_time: string;
  fare: number;
  bus_number: string;
  operator_name: string | null;
  capacity: number;
  bus_type: string;
  source_city: string;
  destination_city: string;
};

type ScheduleSearchResponse = ActionResult & {
  data: ScheduleSearchResult[];
};

export const searchSchedules = async (payload: {
  source: string;
  destination: string;
  date: string;
}): Promise<ScheduleSearchResponse> => {
  try {
    const query = new URLSearchParams(payload).toString();

    return await serverRequest<ScheduleSearchResponse>(
      `schedules/search?${query}`,
      {
        method: "GET",
      },
    );
  } catch (error) {
    console.error("Error searching schedules:", error);
    return { success: false, message: "Failed to search schedules" };
  }
};
