const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export interface APIResponse<T = null> {
  success?: boolean;
  message?: string;
  data?: T;
}

import { refreshSession } from "@/action/session.action";

// refreshSession() owns its own in-flight promise (see session.action.ts),
// so concurrent callers automatically collapse into a single backend refresh.

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
    // refreshSession returns the new accessToken when successful
    // (Route Handler has also attached Set-Cookie to its response,
    // which this browser picks up automatically via credentials: include).
    const newToken = await refreshSession();

    if (newToken) {
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
