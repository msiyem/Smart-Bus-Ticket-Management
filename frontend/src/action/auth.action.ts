"use server";

import { LoginPayload, LoginResponse, User } from "@/lib/types";
import { API_URL } from "@/lib/const";
import { deleteCookie, getCookie, setCookie } from "@/lib/cookies";
import { serverRequest } from "@/action/server-request.action";

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    if (data.accessToken) {
      await setCookie("accessToken", data.accessToken, 60 * 15); // 15 minutes
    }

    if (data.refreshToken) {
      await setCookie("refreshToken", data.refreshToken, 60 * 60 * 24 * 7); // 7 days
    }

    if (data.sessionId) {
      await setCookie("sessionId", data.sessionId, 60 * 60 * 24 * 7); // 7 days
    }

    return data;
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "An error occurred while logging in" };
  }
};

export const registerUser = async (payload: Record<string, unknown>) => {
  return serverRequest("users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const logout = async () => {
  try {
    const refreshToken = await getCookie("refreshToken");
    const sessionId = await getCookie("sessionId");

    const data = await serverRequest("auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken, sessionId }),
    });

    await deleteCookie("accessToken");
    await deleteCookie("refreshToken");
    await deleteCookie("sessionId");
    return data;
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, message: "An error occurred while logging out" };
  }
};

export const getMe = async () => {
  try {
    return await serverRequest("auth/me", {
      method: "GET",
      auth: true,
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return { success: false, message: "Failed to fetch user data" };
  }
};

export const updateUser = async (userId: string, payload: User) => {
  try {
    return await serverRequest(`auth/users/${userId}`, {
      method: "POST",
      auth: true,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, message: "Failed to update user data" };
  }
};

export const deleteUser = async (userId: string) => {
  try {
    return await serverRequest(`users/${userId}`, {
      method: "DELETE",
      auth: true,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, message: "Failed to delete user" };
  }
};


