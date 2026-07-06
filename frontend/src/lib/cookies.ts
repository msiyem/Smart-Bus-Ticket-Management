"use server";
import { cookies } from "next/headers";

// When a Server Action is invoked from a Server Component render path,
// Next.js does not allow `cookies().set()` / `cookies().delete()` to
// mutate the response — it throws `CookieMutationContextError`.
//
// In that case, the only authoritative place that can rotate cookies
// is the /api/auth/refresh Route Handler (called from proxy.ts), which
// forwards the rotated Set-Cookie onto the outgoing response via
// `getSetCookie()`. So when we hit the mutation-context error from a
// render path we treat the cookie write as a best-effort no-op and
// let the proxy / Route Handler do the real work on the next request.
//
// We deliberately do NOT swallow other errors — anything that is not
// the documented mutation-context error is a real bug and must surface.
//
// Error-message fingerprint (Next.js 15+): the message contains the
// phrase "Cookies can only be modified in a Server Action or Route
// Handler.".
const isCookieMutationContextError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  const msg = (err as { message?: unknown }).message;
  return (
    typeof msg === "string" &&
    msg.includes("Cookies can only be modified in a Server Action or Route Handler")
  );
};

const getCookie = async (key: string) => {
  const cookieStore = await cookies();
  const token = cookieStore.get(key);
  return token?.value || null;
};
const setCookie = async (
  key: string,
  value: string,
  maxAge?: number
) => {
  const cookieStore = await cookies();

  try {
    cookieStore.set({
      name: key,
      value,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      ...(maxAge && { maxAge }),
    });
  } catch (err) {
    if (isCookieMutationContextError(err)) {
      // Render-path: let proxy.ts / Route Handler rotate on the next request.
      return;
    }
    throw err;
  }
};
const deleteCookie = async (key: string) => {
  const cookieStore = await cookies();
  try {
    cookieStore.delete(key);
  } catch (err) {
    if (isCookieMutationContextError(err)) {
      // Render-path: clear-on-next-request will happen in proxy.ts /
      // the auth Route Handler when the refresh token is rejected.
      return;
    }
    throw err;
  }
};
const hasCookie = async (key: string) => {
  const cookieStore = await cookies();
  return cookieStore.has(key);
};

export { getCookie, setCookie, hasCookie, deleteCookie };
