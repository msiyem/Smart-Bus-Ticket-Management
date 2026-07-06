"use server";

import { API_URL } from "@/lib/const";
import { getCookie, deleteCookie } from "@/lib/cookies";
import { refreshSession } from "@/action/session.action";

type ServerRequestOptions = RequestInit & {
  auth?: boolean;
};

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

  // Single source of proactive refresh lives in proxy.ts. It runs on
  // the request boundary, can mutate the outgoing response cookies
  // (which serverRequest — invoked from a Server Component render —
  // cannot), and forwards the rotated Set-Cookie to the browser. So
  // we just read whatever cookie state proxy.ts left us and trust it.
  //
  // We do NOT proactively call refreshSession() here: doing so on the
  // same request that proxy.ts just processed would race the proxy's
  // rotation (the request's cookie snapshot still holds the old token)
  // and produce a guaranteed 403 from the backend.
  let token = requiresAuth ? await getCookie("accessToken") : null;

  let response = await request(token);

  if (requiresAuth) {
    if (response.status === 401) {
      // refreshSession returns the freshly minted accessToken directly,
      // not a boolean. We need the new token for the immediate retry,
      // and re-reading from the cookie jar would still return the
      // expired one when this action was invoked from a Server
      // Component render path (the inner Route Handler's Set-Cookie
      // doesn't propagate into the outer action's request snapshot).
      const newToken = await refreshSession();
      if (!newToken) {
        await deleteCookie("accessToken");
        await deleteCookie("refreshToken");
        await deleteCookie("sessionId");
        throw new Error("Session expired");
      }
      token = newToken;
      response = await request(token);

      // If the retry STILL fails with 401, the backend genuinely
      // rejects the new token — bail out instead of looping. The
      // deleteCookie calls below are best-effort: when this action
      // runs from a Server Component render path the mutation
      // context is unavailable and cookies.ts silently no-ops on
      // that one specific error. The user will see the "Session
      // expired" error message on the client.
      if (response.status === 401) {
        await deleteCookie("accessToken");
        await deleteCookie("refreshToken");
        await deleteCookie("sessionId");
        throw new Error("Session expired");
      }
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
