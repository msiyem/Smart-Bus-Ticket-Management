"use server";

import { headers } from "next/headers";
import { API_URL } from "@/lib/const";

type ServerRequestOptions = RequestInit & {
  auth?: boolean;
};

export async function serverRequest<T>(
  endpoint: string,
  { auth = false, headers: customHeaders, ...options }: ServerRequestOptions = {}
): Promise<T> {
  const reqHeaders = new Headers(customHeaders);

  reqHeaders.set("Accept", "application/json");

  if (!(options.body instanceof FormData)) {
    reqHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const incomingHeaders = await headers();
    const cookie = incomingHeaders.get("cookie");

    if (cookie) {
      reqHeaders.set("cookie", cookie);
    }
  }

  const res = await fetch(`${API_URL}/${endpoint.replace(/^\//, "")}`, {
    ...options,
    headers: reqHeaders,
    cache: "no-store",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || "Request failed");
  }

  const contentType = res.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return res.json();
  }

  return (await res.text()) as T;
}