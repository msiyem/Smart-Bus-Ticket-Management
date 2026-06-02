"use server";
import { serverRequest } from "@/action/server-request.action";
import type { Route } from "@/lib/types";

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
    return { success: false, message: "Failed to fetch routes" };
  }
};
