import { z } from "zod";

export type UserRole = "user" | "admin" | "operator";

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
export const USER_INFO_MAX_AGE = 60 * 60 * 24;

export function buildUserInfoCookieValue(user: UserInfo): string {
  const validated = UserInfoSchema.parse(user);
  return JSON.stringify(validated);
}

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