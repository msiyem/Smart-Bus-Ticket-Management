"use server";
import { cookies } from "next/headers";

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

  cookieStore.set({
    name: key,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(maxAge && { maxAge }),
  });
};
const deleteCookie = async (key: string) => {
  const cookieStore = await cookies();
  cookieStore.delete(key);
};
const hasCookie = async (key: string) => {
  const cookieStore = await cookies();
  return cookieStore.has(key);
};

export { getCookie, setCookie, hasCookie, deleteCookie };
