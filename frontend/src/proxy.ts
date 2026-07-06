import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/users",
  "/routes",
  "/buses",
  "/operators",
  "/schedules",
  "/trips",
  "/bookings",
  "/payments",
  "/profile",
];

const REFRESH_LEEWAY_SECONDS = 15; 

type JwtPayload = {
  userId?: string | number;
  role?: string;
  exp?: number;
  iat?: number;
  [k: string]: unknown;
};

const isProtected = (pathname: string) =>
  PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip Next.js internals and static asset requests (the matcher below
  // also filters these, but checking here is cheaper and clearer).
  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;
  const sessionId = req.cookies.get("sessionId")?.value;

  // No session at all — let the page handle the unauthenticated UI.
  if (!refreshToken || !sessionId) {
    return NextResponse.next();
  }

  // Decoding the access token decides what to do:
  //   - missing OR expired/within leeway -> proactively refresh
  //   - valid -> let the request through untouched
  let shouldRefresh = !accessToken;

  if (accessToken) {
    try {
      const decoded = jwtDecode<JwtPayload>(accessToken);
      const exp = decoded.exp;
      if (typeof exp !== "number") {
        shouldRefresh = true;
      } else {
        const nowSec = Math.floor(Date.now() / 1000);
        shouldRefresh = exp - nowSec <= REFRESH_LEEWAY_SECONDS;
      }
    } catch {
      // Malformed JWT — refresh so the next render sees a clean token.
      shouldRefresh = true;
    }
  }

  if (shouldRefresh) {
    return await proxyRefresh(req, refreshToken, sessionId);
  }

  return NextResponse.next();
}

/**
 * Parse a single Set-Cookie header line into { name, value }.
 * Example: "accessToken=abc123; Path=/; HttpOnly" -> { name: "accessToken", value: "abc123" }
 * Returns null if the line has no `=` separator (malformed).
 */
const parseSetCookieLine = (
  line: string,
): { name: string; value: string } | null => {
  const eqIdx = line.indexOf("=");
  if (eqIdx <= 0) return null;
  const semiIdx = line.indexOf(";");
  const rawValue =
    semiIdx > 0 ? line.slice(eqIdx + 1, semiIdx) : line.slice(eqIdx + 1);
  return {
    name: line.slice(0, eqIdx).trim(),
    value: rawValue.trim(),
  };
};

/**
 * Forward the refresh call to our same-origin Route Handler, then:
 *   1. Copy the Set-Cookie headers onto the OUTGOING response so the
 *      browser receives the rotated tokens on this round-trip.
 *   2. Mutate the INCOMING request's cookie snapshot so any downstream
 *      Server Action invoked during this same request lifecycle (e.g.
 *      getUser(), serverRequest) reads the new tokens instead of the
 *      old ones. Without this, serverRequest would see the stale
 *      refresh token, trigger a second refresh, and get 403'd because
 *      the backend already rotated the token in step (1).
 *
 * We use getSetCookie() when available (it's structured and safe with
 * values containing commas such as Expires dates) and fall back to a
 * regex split for older runtimes.
 */
async function proxyRefresh(
  req: NextRequest,
  refreshToken: string,
  sessionId: string,
) {
  const origin = req.nextUrl.origin;
  const upstream = await fetch(`${origin}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      cookie: req.headers.get("cookie") ?? "",
    },
    body: JSON.stringify({ refreshToken, sessionId }),
  });

  // Always allow the original request through; the page can decide
  // whether to redirect to /login. We only attach new cookies here.
  const res = NextResponse.next();

  if (upstream.ok) {
    const cookieLines =
      typeof (upstream.headers as Headers).getSetCookie === "function"
        ? (upstream.headers as Headers).getSetCookie()
        : (() => {
            const single = upstream.headers.get("set-cookie");
            return single ? [single] : [];
          })();

    // Tokens we care about for downstream reads inside this request.
    // We intentionally only rewrite these three — anything else (CSRF,
    // session flags, etc.) is left as the proxy originally received.
    const REWRITABLE = new Set(["accessToken", "refreshToken", "sessionId"]);

    for (const line of cookieLines) {
      // (1) Browser-bound Set-Cookie on the outgoing response.
      res.headers.append("set-cookie", line);

      // (2) Request-snapshot rewrite so the rest of this request sees
      //     the rotated tokens. This is the key fix that prevents the
      //     refresh cascade (200 then 403) we kept seeing in logs.
      const parsed = parseSetCookieLine(line);
      if (parsed && REWRITABLE.has(parsed.name)) {
        req.cookies.set(parsed.name, parsed.value);
      }
    }
  }

  return res;
}

export const config = {
  // Skip Next internals and static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
