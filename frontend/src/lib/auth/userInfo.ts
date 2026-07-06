/**
 * User-info cookie helpers — a NON-HttpOnly companion to accessToken /
 * refreshToken / sessionId that exposes only the non-sensitive fields
 * the UI needs to render instantly (avatar, name, role, login state)
 * without a backend round-trip.
 *
 * Security model:
 *   - accessToken / refreshToken / sessionId  ⇒  HttpOnly, JS can NEVER read
 *   - userInfo                                ⇒  readable by client JS, contains ONLY:
 *                                                  userId, role, name, email, username, phone
 *                                                  NEVER password, NEVER tokens, NEVER PII beyond
 *                                                  what the navbar already shows.
 *
 *   The client MUST NOT treat this cookie as authoritative for authorization.
 *   Server-side `getUser()` remains the source of truth — `userInfo` exists
 *   purely for fast UI hydration.
 *
 * Storage:
 *   - URL-encoded JSON in a single cookie named `userInfo`.
 *   - maxAge = 7 days (matches refreshToken).
 *   - Cleared by /api/auth/refresh on failure and by the logout action.
 */
import { z } from "zod";
import { jwtDecode } from "jwt-decode";

export type UserRole = "user" | "admin" | "operator";

/**
 * The exact shape we are willing to read out of a userInfo cookie.
 * Anything not listed here is dropped — defense in depth against
 * cookie tampering.
 */
const UserInfoSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["user", "admin", "operator"]),
  name: z.string().nullable().optional(),
  email: z.string().email(),
  username: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
});

export type UserInfo = z.infer<typeof UserInfoSchema>;

export const USER_INFO_COOKIE = "userInfo" as const;
export const USER_INFO_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Build a cookie-friendly representation of the user. Returns the
 * raw JSON string — Next.js's `res.cookies.set()` URL-encodes the
 * value itself when emitting Set-Cookie, so callers must NOT
 * pre-encode or the value will end up double-encoded on the wire.
 *
 * IMPORTANT: pass only trustable fields. Never include raw tokens,
 * password hashes, or anything marked `sensitive`.
 */
export function buildUserInfoCookieValue(
  user: UserInfo,
): string {
  // Filter through Zod so a malformed input throws rather than
  // silently baking garbage into the cookie.
  const validated = UserInfoSchema.parse(user);
  return JSON.stringify(validated);
}

/**
 * Read and validate the userInfo cookie value from the browser.
 * Returns null when the cookie is missing, malformed, or fails
 * validation. NEVER throws.
 */
export function parseUserInfoCookieValue(
  raw: string | null | undefined,
): UserInfo | null {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded);
    const result = UserInfoSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Pull the user-info fields out of a JWT access token. Used by
 * /api/auth/refresh so the rotated userInfo cookie stays in sync
 * with the new access token's claims.
 *
 * Validates strictly via Zod — any unexpected shape from a malformed
 * token is dropped on the floor.
 */
export function extractUserInfoFromAccessToken(
  accessToken: string,
): UserInfo | null {
  try {
    const decoded = jwtDecode<Record<string, unknown>>(accessToken);
    const candidate = {
      userId: String(decoded.userId ?? ""),
      role: (decoded.role as UserRole) ?? "user",
      name: (decoded.name as string | null | undefined) ?? null,
      email: String(decoded.email ?? ""),
      username: (decoded.username as string | null | undefined) ?? null,
      phone: (decoded.phone as string | null | undefined) ?? null,
    };
    const result = UserInfoSchema.safeParse(candidate);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
