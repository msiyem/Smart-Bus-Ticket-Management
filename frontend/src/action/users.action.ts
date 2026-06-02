"use server";
import { serverRequest } from "@/action/server-request.action";
import type { User } from "@/lib/types";

type ActionResult = { success: boolean; message?: string };

type GetUsersResponse = ActionResult & { data?: User[] };

export const getAllUsers = async (): Promise<GetUsersResponse> => {
  try {
    return await serverRequest<GetUsersResponse>("users", {
      method: "GET",
      auth: true,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, message: "Failed to fetch users" };
  }
};
