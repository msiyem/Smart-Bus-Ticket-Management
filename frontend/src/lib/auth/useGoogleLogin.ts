"use client";

import { useCallback, useEffect, useState } from "react";
import { clientGoogleLogin } from "@/lib/auth/client";

// GIS script (not @react-oauth/google) to keep the dep surface small and integration explicit.
const GIS_SRC = "https://accounts.google.com/gsi/client";

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  prompt: () => void;
  renderButton: (
    parent: HTMLElement,
    options: Record<string, unknown>,
  ) => void;
};

type GoogleAccounts = {
  id: GoogleAccountsId;
};

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
  }
}

let scriptLoadingPromise: Promise<void> | null = null;
let initializedClientId: string | null = null;
let credentialHandler:
  | ((response: { credential?: string }) => void)
  | null = null;

const loadGisScript = (): Promise<void> => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google login is only available in the browser"));
  }
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${GIS_SRC}"]`,
    ) as HTMLScriptElement | null;

    const onReady = () => {
      if (window.google?.accounts?.id) resolve();
      else reject(new Error("Google Identity Services failed to load"));
    };

    if (existing) {
      if (window.google?.accounts?.id) return resolve();
      existing.addEventListener("load", onReady);
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load GIS script")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = onReady;
    script.onerror = () => reject(new Error("Failed to load GIS script"));
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
};

const initializeGis = async (clientId: string): Promise<void> => {
  await loadGisScript();

  if (initializedClientId === clientId) return;

  window.google!.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => credentialHandler?.(response),
    cancel_on_tap_outside: true,
    auto_select: false,
  });
  initializedClientId = clientId;
};

type Status = "idle" | "loading" | "ready" | "submitting" | "error";

export function useGoogleLogin() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!clientId) {
        setError("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set");
        setStatus("error");
        return;
      }
      setStatus("loading");
      try {
        await initializeGis(clientId);
        if (cancelled) return;

        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        console.error("Google init failed:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load Google login",
        );
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const loginWithGoogle = useCallback(async () => {
    if (status !== "ready" || !window.google?.accounts?.id) {
      return {
        success: false,
        message: error || "Google login is not ready yet",
      };
    }

    setStatus("submitting");
    setError(null);

    try {
      const { credential } = await new Promise<{ credential: string }>(
        (resolve, reject) => {
          credentialHandler = (response) => {
            if (response.credential) {
              resolve({ credential: response.credential });
            } else {
              reject(new Error("Google did not return a credential"));
            }
          };
          window.google!.accounts.id.prompt();
        },
      );

      const result = await clientGoogleLogin(credential);
      setStatus(result.success ? "ready" : "error");
      if (!result.success) {
        setError(result.message || "Google login failed");
      }
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Google login failed";
      setError(message);
      setStatus("error");
      return { success: false, message };
    } finally {
      credentialHandler = null;
    }
  }, [status, error]);

  return { status, error, loginWithGoogle };
}
