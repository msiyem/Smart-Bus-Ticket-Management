"use server";

import { cookies } from "next/headers";
import { cache } from "react";
import { jwtDecode } from "jwt-decode";
import type { UserRole } from "@/lib/types";
import {
  parseUserInfoCookieValue,
  type UserInfo,
} from "@/lib/auth/userInfo";

type AuthUser = UserInfo;

type JwtPayload = {
  userId?: string | number;
  role?: string;
  exp?: number;
  [k: string]: unknown;
};

const normalizeRole = (raw: unknown): UserRole => {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "admin" || v === "operator" || v === "user") return v;
  return "user";
};

const _getUser = cache(
  async (): Promise<AuthUser | null> => {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) return null;

    let decoded: JwtPayload;
    try {
      decoded = jwtDecode<JwtPayload>(token);
    } catch {
      return null;
    }

    const userId =
      typeof decoded.userId === "string"
        ? decoded.userId
        : decoded.userId != null
          ? String(decoded.userId)
          : null;

    if (!userId) return null;

    const info = parseUserInfoCookieValue(
      cookieStore.get("userInfo")?.value,
    );

    if (info) {
      return {
        userId,
        role: normalizeRole(info.role),
        name: info.name ?? null,
        email: info.email,
        username: info.username ?? null,
        phone: info.phone ?? null,
      };
    }

    return {
      userId,
      role: normalizeRole(decoded.role),
      name: null,
      email: "",
      username: null,
      phone: null,
    };
  },
);

export async function getUser(): Promise<AuthUser | null> {
  return _getUser();
}