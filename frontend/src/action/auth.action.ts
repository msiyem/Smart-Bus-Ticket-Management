"use server";

import { LoginPayload, LoginResponse, User } from "@/lib/types";
import { API_URL } from "@/lib/const";
import { deleteCookie, getCookie, setCookie } from "@/lib/cookies";
import { serverRequest } from "@/action/server-request.action";
import { parseFormData, formatZodErrors } from "@/action/form-data";
import { loginUserSchema, LoginUserData } from "@/lib/validations/login";
import { registerSchema, RegisterSchema } from "@/lib/validations/register";
import {
  buildUserInfoCookieValue,
  extractUserInfoFromAccessToken,
  USER_INFO_COOKIE,
  USER_INFO_MAX_AGE,
} from "@/lib/auth/userInfo";

export type FormActionResult<T = unknown> =
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

    // Companion non-HttpOnly cookie for fast client-side UI hydration.
    // Belt-and-braces: try backend user first, fall back to claims from the
    // freshly-issued JWT so this stays correct even if the backend changes
    // the login payload later.
    const userForCookie =
      data.user ?? extractUserInfoFromAccessToken(data.accessToken ?? "");
    if (userForCookie) {
      await setCookie(
        USER_INFO_COOKIE,
        buildUserInfoCookieValue(userForCookie),
        USER_INFO_MAX_AGE,
      );
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

/**
 * Server action that validates a FormData payload against the Zod login
 * schema before forwarding to the API. Designed to be used with
 * react-hook-form's `formAction` prop or a direct form submit.
 */
export const loginFormAction = async (
  _prev: FormActionResult<LoginResponse> | undefined,
  formData: FormData,
): Promise<FormActionResult<LoginResponse>> => {
  let parsed: LoginUserData;
  try {
    parsed = (await parseFormData(formData, loginUserSchema)) as LoginUserData;
  } catch (error) {
    const zodError = error as import("zod").ZodError;
    return {
      success: false,
      message: formatZodErrors(zodError),
      fieldErrors: toFieldErrors(zodError),
    };
  }

  const result = await login(parsed);
  if (!result.success) {
    return {
      success: false,
      message: result.message || "Login failed",
    };
  }
  return { success: true, data: result };
};

/**
 * Server action that validates a FormData payload against the Zod register
 * schema before forwarding to the API.
 */
export const registerFormAction = async (
  _prev: FormActionResult | undefined,
  formData: FormData,
): Promise<FormActionResult> => {
  let parsed: RegisterSchema;
  try {
    parsed = (await parseFormData(formData, registerSchema)) as RegisterSchema;
  } catch (error) {
    const zodError = error as import("zod").ZodError;
    return {
      success: false,
      message: formatZodErrors(zodError),
      fieldErrors: toFieldErrors(zodError),
    };
  }

  // Strip confirmPassword before sending to backend
  const { confirmPassword: _omit, ...payload } = parsed;
  const result = await registerUser(payload as Record<string, unknown>);
  if (
    result &&
    typeof result === "object" &&
    "success" in (result as Record<string, unknown>) &&
    (result as { success?: boolean }).success === false
  ) {
    return {
      success: false,
      message:
        (result as { message?: string }).message || "Registration failed",
    };
  }
  return { success: true, data: result };
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
    await deleteCookie(USER_INFO_COOKIE);
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


