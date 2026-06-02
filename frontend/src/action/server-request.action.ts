"use server";

import { API_URL } from "@/lib/const";
import { getCookie, deleteCookie } from "@/lib/cookies";
import { refreshSession } from "@/action/session.action";

type ServerRequestOptions = RequestInit & {
  auth?: boolean;
};

let refreshPromise: Promise<boolean> | null = null;

export async function serverRequest<T>(
  endpoint: string,
  options: ServerRequestOptions = {},
): Promise<T> {
  const path = endpoint.replace(/^\//, "");
  const requiresAuth = options.auth ?? false;
  const { headers: requestHeaders, ...fetchOptions } = options;

  const request = async (token: string | null) => {
    const headers = new Headers({
      Accept: "application/json",
      ...(requestHeaders || {}),
    });

    // FormData hole Content-Type set korbe na
    if (!(fetchOptions.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    if (requiresAuth && token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(`${API_URL}/${path}`, {
      ...fetchOptions,
      headers,
    });
  };

  let token = requiresAuth ? await getCookie("accessToken") : null;

  let refreshed = false;

  if (requiresAuth && !token) {
    if (!refreshPromise) {
      refreshPromise = refreshSession();
    }

    refreshed = await refreshPromise;
    refreshPromise = null;

    token = refreshed ? await getCookie("accessToken") : null;
  }

  let response = await request(token);

  if (requiresAuth && response.status === 401 && !refreshed) {
    if (!refreshPromise) {
      refreshPromise = refreshSession();
    }

    refreshed = await refreshPromise;
    refreshPromise = null;

    if (refreshed) {
      token = await getCookie("accessToken");

      response = await request(token);
    } else {
      await deleteCookie("accessToken");

      await deleteCookie("refreshToken");

      await deleteCookie("sessionId");

      throw new Error("Session expired");
    }
  }

  const contentType = response.headers.get("content-type");

  if (!response.ok) {
    let message = "Request failed";

    try {
      const errorData = await response.json();

      message = errorData?.message || message;
    } catch {
      if (contentType?.includes("text/plain")) {
        message = await response.text();
      }
    }

    throw new Error(message);
  }

  if (contentType?.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}
