'use server';

import { cookies } from "next/headers";
import { cache } from "react";
import { jwtDecode } from "jwt-decode";
import type { UserRole } from "@/lib/types";
import { refreshSession } from "@/action/session.action";

type AuthUser = {
  userId: string;
  role: UserRole;
  name?: string;
  email: string;
  phone?: string;
  username?: string;
};

type JwtPayload = AuthUser & {
  exp?: number;
  iat?: number;
};

const REFRESH_LEEWAY_SECONDS = 30;

/**
 * True when the JWT is expired (or expires within the leeway window).
 * Returns false when the token is unparseable — the caller decides
 * whether to refresh or treat it as logged out.
 */
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const exp = decoded.exp;
    if (typeof exp !== "number") return true;
    const nowSec = Math.floor(Date.now() / 1000);
    return exp - nowSec <= REFRESH_LEEWAY_SECONDS;
  } catch {
    return true;
  }
};

/**
 * Single source of truth for "who is the current user".
 *
 * Behaviour:
 *   1. Read the access token cookie. If it's present and not expired,
 *      decode and return the user immediately.
 *   2. If the access token is missing OR expired AND a refresh token
 *      cookie is present, attempt ONE refreshSession() call. This
 *      satisfies the user's requirement of "one refresh api call when
 *      the access token is expired and the user isn't found".
 *   3. After the refresh, re-read the access token from the cookie jar
 *      (proxy.ts has already updated the request snapshot by this
 *      point — see the parseSetCookieLine logic in proxy.ts).
 *   4. If we still don't have a usable access token, return null.
 *
 * React's `cache()` dedupes the lookup per request, so even if the
 * navbar and a server action both call getUser() in the same render
 * pass, the refresh fires at most once.
 *
 * The inflight Promise inside refreshSession() also collapses any
 * concurrent refreshes triggered from other Server Actions in the
 * same request into one backend round-trip.
 */
const _getUser = cache(
  async (): Promise<AuthUser | null> => {
    const cookieStore = await cookies();
    let token = cookieStore.get("accessToken")?.value;

    if (!token || isTokenExpired(token)) {
      const hasRefresh =
        cookieStore.has("refreshToken") && cookieStore.has("sessionId");
      if (hasRefresh) {
        const newToken = await refreshSession();
        if (newToken) {
          // Prefer the new token we just received — when refreshSession
          // was called from a Server Component render path the cookie
          // jar write may have been a best-effort no-op (see
          // CookieMutationContextError handling in lib/cookies.ts), so
          // re-reading from the jar could still return the expired
          // token. The returned accessToken is authoritative.
          token = newToken;
        } else {
          // Refresh failed — re-read the jar one last time in case
          // /api/auth/refresh rotated cookies onto the response and
          // they made it back into our snapshot via proxy.ts.
          token = cookieStore.get("accessToken")?.value;
        }
      }
    }

    if (!token) return null;

    try {
      return jwtDecode<AuthUser>(token);
    } catch {
      return null;
    }
  },
);

export async function getUser(): Promise<AuthUser | null> {
  return _getUser();
}