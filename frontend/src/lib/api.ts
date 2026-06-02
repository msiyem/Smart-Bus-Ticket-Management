const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export interface APIResponse<T = null> {
  success?: boolean;
  message?: string;
  data?: T;
}

import { refreshSession } from "@/action/session.action";

// prevent multiple refresh calls
let refreshPromise: Promise<boolean> | null = null;

async function refreshToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshSession()
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function API<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = false,
): Promise<T> {
  const url = `${API_BASE_URL}/${endpoint.replace(/^\//, "")}`;

  const res = await fetch(url, {
    credentials: "include", //cookie-based auth
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  // auto refresh on 401 and retry once

  if (res.status === 401 && !retry) {
    const ok = await refreshToken();

    if (ok) {
      return API<T>(endpoint, options, true);
    }

    throw new Error("SESSION_EXPIRED");
  }

  // error handling

  if (!res.ok) {
    let message = "Request failed";

    try {
      const err = await res.json();
      message = err?.message || message;
    } catch {}

    throw new Error(message);
  }

  const contentType = res.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return (await res.json()) as T;
  }

  return (await res.text()) as T;
}
