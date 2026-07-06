import { NextResponse } from "next/server";
import { API_URL } from "@/lib/const";
import {
  buildUserInfoCookieValue,
  extractUserInfoFromAccessToken,
  USER_INFO_COOKIE,
  USER_INFO_MAX_AGE,
} from "@/lib/auth/userInfo";

const FIFTEEN_MIN = 60 * 15;
const SEVEN_DAYS = 60 * 60 * 24 * 7;

export const POST = async (req: Request) => {
  const body = await req.json().catch(() => null);
  const refreshToken = body?.refreshToken as string | undefined;
  const sessionId = body?.sessionId as string | undefined;

  if (!refreshToken || !sessionId) {
    return NextResponse.json(
      { success: false, message: "Missing refreshToken or sessionId" },
      { status: 400 },
    );
  }

  const upstream = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refreshToken, sessionId }),
  });

  const data = await upstream.json().catch(() => ({}));

  const res = NextResponse.json(
    { success: upstream.ok, ...data },
    { status: upstream.status },
  );

  if (upstream.ok) {
    if (data.accessToken) {
      res.cookies.set("accessToken", data.accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: FIFTEEN_MIN,
      });
    }
    if (data.refreshToken) {
      res.cookies.set("refreshToken", data.refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: SEVEN_DAYS,
      });
    }
    if (data.sessionId) {
      res.cookies.set("sessionId", data.sessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: SEVEN_DAYS,
      });
    }

    // Sync the companion userInfo cookie so the UI stays hydrated.
    // Backend refresh does not return user info, so we decode the
    // freshly-rotated accessToken to rebuild it.
    const userInfo = extractUserInfoFromAccessToken(data.accessToken ?? "");
    if (userInfo) {
      const raw = buildUserInfoCookieValue(userInfo);
      res.cookies.set(USER_INFO_COOKIE, raw, {
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: USER_INFO_MAX_AGE,
      });
    } else {
      // Token rotated but we couldn't parse the claims — drop the stale one.
      res.cookies.delete(USER_INFO_COOKIE);
    }
  } else {
    // Refresh failed — clear everything so the client is forced to re-login
    // and the proxy doesn't loop on a dead session.
    res.cookies.delete("accessToken");
    res.cookies.delete("refreshToken");
    res.cookies.delete("sessionId");
    res.cookies.delete(USER_INFO_COOKIE);
  }

  return res;
};