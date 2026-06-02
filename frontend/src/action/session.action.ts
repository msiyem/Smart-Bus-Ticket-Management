"use server";

import { API_URL } from "@/lib/const";
import { deleteCookie, getCookie, setCookie } from "@/lib/cookies";

export const refreshSession = async () => {
  try {
    const refreshToken = await getCookie("refreshToken");
    const sessionId = await getCookie("sessionId");

    if (!refreshToken || !sessionId) {
      return false;
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ refreshToken, sessionId }),
    });

    const data = await response.json();

    if (!response.ok) {
    await deleteCookie("accessToken");
    await deleteCookie("refreshToken");
    await deleteCookie("sessionId");
    return false; // instead of throwing
  }

    if (data.accessToken) {
      await setCookie("accessToken", data.accessToken, 60 * 15);
    }

    if (data.refreshToken) {
      await setCookie("refreshToken", data.refreshToken, 60 * 60 * 24 * 3);
    }

    if (data.sessionId) {
      await setCookie("sessionId", data.sessionId, 60 * 60 * 24 * 3);
    }

    return true;
  } catch (error) {
    console.error("Refresh error:", error);
    return false;
  }
};
