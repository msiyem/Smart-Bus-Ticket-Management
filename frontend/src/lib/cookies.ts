"use server";
import { cookies } from "next/headers";

const isCookieMutationContextError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  const msg = (err as { message?: unknown }).message;
  return (
    typeof msg === "string" &&
    msg.includes("Cookies can only be modified in a Server Action or Route Handler")
  );
};

export const deleteCookie = async (key: string) => {
  const cookieStore = await cookies();
  try {
    cookieStore.delete(key);
  } catch (err) {
    if (isCookieMutationContextError(err)) {
      return;
    }
    throw err;
  }
};