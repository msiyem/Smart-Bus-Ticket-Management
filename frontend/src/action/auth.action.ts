"use server";

import { requireApiUrl } from "@/lib/const";
import { deleteCookie } from "@/lib/cookies";
import { serverRequest } from "@/action/server-request.action";
import { parseFormData, formatZodErrors } from "@/action/form-data";
import { loginUserSchema, LoginUserData } from "@/lib/validations/login";
import { registerSchema, RegisterSchema } from "@/lib/validations/register";
import { LoginPayload, LoginResponse, User } from "@/lib/types";
import { USER_INFO_COOKIE } from "@/lib/auth/userInfo";

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
    const response = await fetch(`${requireApiUrl()}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: data?.message || "Login failed",
      };
    }

    return {
      success: true,
      message: data?.message || "Login successful",
      user: data?.user,
    };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "An error occurred while logging in" };
  }
};

export const googleLogin = async (idToken: string): Promise<LoginResponse> => {
  try {
    if (!idToken) {
      return { success: false, message: "Missing Google idToken" };
    }

    const response = await fetch(`${requireApiUrl()}/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ idToken }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: data?.message || "Google login failed",
      };
    }

    return {
      success: true,
      message: data?.message || "Google login successful",
      user: data?.user,
    };
  } catch (error) {
    console.error("Google login error:", error);
    return {
      success: false,
      message: "An error occurred during Google login",
    };
  }
};

export const registerUser = async (payload: Record<string, unknown>) => {
  return serverRequest("users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

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
    const response = await fetch(`${requireApiUrl()}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    await deleteCookie("accessToken");
    await deleteCookie(USER_INFO_COOKIE);

    return data?.success
      ? { success: true, message: data.message || "Logged out" }
      : { success: false, message: data?.message || "Logout failed" };
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
    return await serverRequest(`users/${userId}`, {
      method: "PUT",
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
