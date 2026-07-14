"use server";

import { serverRequest } from "@/action/server-request.action";
import type { User, UserRole } from "@/lib/types";

type ActionResult<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
};

type GetUsersResponse = ActionResult<User[]>;
type UserResponse = ActionResult<{ user: User }>;
type CreateUserPayload = {
  name: string;
  username?: string;
  email: string;
  password: string;
  confirmPassword: string;
  address: string;
  role: UserRole;
};

export const getAllUsers = async (): Promise<GetUsersResponse> => {
  try {
    return await serverRequest<GetUsersResponse>("users", {
      method: "GET",
      auth: true,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch users";
    return { success: false, message };
  }
};

export const createUserAction = async (
  payload: CreateUserPayload,
): Promise<UserResponse> => {
  try {
    return await serverRequest<UserResponse>("users", {
      method: "POST",
      auth: true,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Error creating user:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create user";
    return { success: false, message };
  }
};

export const getUser = async (id: number): Promise<UserResponse> => {
  try {
    return await serverRequest<UserResponse>(`users/${id}`, {
      method: "GET",
      auth: true,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch user";
    return { success: false, message };
  }
};

export const updateUserAction = async (
  id: number,
  patch: Partial<Omit<User, "id" | "created_at" | "updated_at">> & {
    password?: string;
  },
): Promise<UserResponse> => {
  try {
    return await serverRequest<UserResponse>(`users/${id}`, {
      method: "PUT",
      auth: true,
      body: JSON.stringify(patch),
    });
  } catch (error) {
    console.error("Error updating user:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update user";
    return { success: false, message };
  }
};

export const deleteUserAction = async (
  id: number,
): Promise<ActionResult<{ userId?: number }>> => {
  try {
    return await serverRequest<ActionResult<{ userId?: number }>>(
      `users/${id}`,
      { method: "DELETE", auth: true },
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete user";
    return { success: false, message };
  }
};
