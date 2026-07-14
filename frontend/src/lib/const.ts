export const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export function requireApiUrl(): string {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  return API_URL.replace(/\/$/, "");
}