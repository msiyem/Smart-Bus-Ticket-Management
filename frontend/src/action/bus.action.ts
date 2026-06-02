"use server";
import { serverRequest } from "@/action/server-request.action";
import type { Bus } from "@/lib/types";

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
