'use server';

import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

type AuthUser = {
  userId: string;
  role: "user" | "admin";
  name?: string;
  email: string;
  phone?: string;
  username?: string;
};

export async function getUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();

  const token = cookieStore.get("accessToken")?.value;

  if (!token) return null;

  return jwtDecode<AuthUser>(token);
}