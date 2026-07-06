"use server";

import { headers } from "next/headers";
import { deleteCookie, getCookie, setCookie } from "@/lib/cookies";

/**
 * Single in-flight refresh promise for the entire server runtime.
 * Every caller (api wrapper, navbar, page-level guards) shares this,
 * so concurrent triggers collapse into exactly one backend refresh.
 *
 * The promise is created synchronously the first time refreshSession()
 * runs, so any caller arriving mid-flight awaits the same resolution
 * instead of starting a duplicate request.
 *
 * IMPORTANT: We delegate to the same-origin /api/auth/refresh Route
 * Handler so the new tokens land in the cookie jar. Route Handlers
 * are allowed to mutate cookies even when invoked during a Server
 * Component render, which `cookies().set()` is not.
 *
 * The new accessToken is also returned in the response body so callers
 * can use it directly for the immediate retry without depending on the
 * outer cookie jar being updated in the same request lifecycle (which
 * it isn't when this action was triggered from a Server Component
 * render path).
 */
let inflight: Promise<string | null> | null = null;

export const refreshSession = async (): Promise<string | null> => {
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const refreshToken = await getCookie("refreshToken");
      const sessionId = await getCookie("sessionId");

      if (!refreshToken || !sessionId) {
        return null;
      }

      const h = await headers();
      const host = h.get("host") ?? "localhost:3000";
      const proto =
        h.get("x-forwarded-proto") ??
        (process.env.NODE_ENV === "production" ? "https" : "http");
      const cookieHeader = h.get("cookie") ?? "";

      const response = await fetch(`${proto}://${host}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          cookie: cookieHeader,
        },
        body: JSON.stringify({ refreshToken, sessionId }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        await deleteCookie("accessToken");
        await deleteCookie("refreshToken");
        await deleteCookie("sessionId");
        return null;
      }

      // Persist the rotated tokens. We're inside a Server Action here
      // (refreshSession is "use server"), so cookies().set() is legal
      // — but only when refreshSession was invoked directly by a form
      // action. When it runs from a Server Component render path the
      // mutation context is unavailable; cookies.ts swallows that one
      // specific error and the proxy / /api/auth/refresh Route Handler
      // does the authoritative rotation on the next request.
      if (data.accessToken) {
        await setCookie("accessToken", data.accessToken, 60 * 15);
      }
      if (data.refreshToken) {
        await setCookie(
          "refreshToken",
          data.refreshToken,
          60 * 60 * 24 * 7,
        );
      }
      if (data.sessionId) {
        await setCookie("sessionId", data.sessionId, 60 * 60 * 24 * 7);
      }

      return (data.accessToken as string | undefined) ?? null;
    } catch (error) {
      console.error("Refresh error:", error);
      return null;
    } finally {
      // Always release the slot, success or failure, so the next legitimate
      // refresh can run. Releasing here (not after the await) prevents a
      // second caller from racing past the guard while cookies are still
      // being written.
      inflight = null;
    }
  })();

  return inflight;
};
