"use server";
import { serverRequest } from "@/action/server-request.action";

type ActionResult = { success: boolean; message?: string };

type CreateScheduleResponse = ActionResult & { scheduleId?: number };

export const createSchedule = async (payload: {
  route_id: number;
  bus_id: number;
  departure_time: string;
  arrival_time: string;
  fare: number;
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
