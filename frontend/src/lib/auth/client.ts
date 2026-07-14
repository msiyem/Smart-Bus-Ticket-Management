import type { LoginResponse } from "@/lib/types";
import {
  buildUserInfoCookieValue,
  type UserInfo,
  USER_INFO_COOKIE,
  USER_INFO_MAX_AGE,
} from "@/lib/auth/userInfo";
import { requireApiUrl } from "@/lib/const";

const jsonHeaders = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data?.message || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

function setUserInfoCookie(user: UserInfo): void {
  const value = encodeURIComponent(buildUserInfoCookieValue({
    ...user,
    userId: String(user.userId),
  }));
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${USER_INFO_COOKIE}=${value}; Path=/; Max-Age=${USER_INFO_MAX_AGE}; SameSite=Lax${secure}`;
}

function clearUserInfoCookie(): void {
  document.cookie = `${USER_INFO_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export async function clientLogin(
  email: string,
  password: string,
): Promise<LoginResponse> {
  try {
    const res = await fetch(`${requireApiUrl()}/auth/login`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ email, password }),
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      return { success: false, message: await parseError(res) };
    }

    const data = await res.json();
    if (data?.user) setUserInfoCookie(data.user);
    return {
      success: true,
      message: data?.message || "Login successful",
      user: data?.user,
    };
  } catch (error) {
    console.error("clientLogin error:", error);
    return { success: false, message: "An error occurred while logging in" };
  }
}

export async function clientGoogleLogin(
  idToken: string,
): Promise<LoginResponse> {
  try {
    const res = await fetch(`${requireApiUrl()}/auth/google`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ idToken }),
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      return { success: false, message: await parseError(res) };
    }

    const data = await res.json();
    if (data?.user) setUserInfoCookie(data.user);
    return {
      success: true,
      message: data?.message || "Google login successful",
      user: data?.user,
    };
  } catch (error) {
    console.error("clientGoogleLogin error:", error);
    return {
      success: false,
      message: "An error occurred during Google login",
    };
  }
}

export async function clientLogout(): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const res = await fetch(`${requireApiUrl()}/auth/logout`, {
      method: "POST",
      headers: jsonHeaders,
      credentials: "include",
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) clearUserInfoCookie();
    return {
      success: !!res.ok && data?.success !== false,
      message: data?.message,
    };
  } catch (error) {
    console.error("clientLogout error:", error);
    return { success: false, message: "An error occurred while logging out" };
  }
}
