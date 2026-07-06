# Next.js 16 Production-Ready Auth Architecture
## No Middleware · No Proxy · No NextAuth · No Clerk · HttpOnly Cookies · Backend as Source of Truth

---

## Loading Bug Diagnosis (first, briefly)

The "loading" symptom you're seeing in the browser is almost certainly **NOT a real hang**. Server-side rendering works correctly — `curl http://localhost:3000/` returns `200 OK` with all UI elements rendered (Login button, From label, Search button, cover image).

The real causes are:

1. **Turbopack cold compile** — first request takes ~7–8 s. Subsequent renders cache at ~200–800 ms. Browser shows a blank screen during cold compile, which looks like "loading".
2. **`src/proxy.ts` matcher is too broad** — your regex `((?!_next/static|_next/image|...).*)` includes the root `/`. Every request runs the proxy, even the homepage. This adds ~192 ms per request. Fix the matcher (see §19).
3. **Browser DevTools / dev overlay** may be hiding the page. Press `Ctrl+Shift+R` for hard reload, then check the Console tab for client-side runtime errors.

Hard-reload confirmation steps (no rebuild needed):

```powershell
# In your browser:
# 1. DevTools → Network tab → check "Disable cache"
# 2. Ctrl+Shift+R  (hard reload)
# 3. Console tab — paste this to confirm cookies exist:
document.cookie  // empty? — httpOnly cookies are correctly hidden from JS. Good.
# 4. Application tab → Cookies → http://localhost:3000 → confirm accessToken / refreshToken are present and httpOnly ✓
```

If after a hard reload with cache disabled you still see a blank page, the symptom is from a client-side runtime error — share the Console output and I can pinpoint it.

---

## §1 — Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         BROWSER (Client)                                  │
│  - React 19 / Client Components                                             │
│  - useAuth() hook reads Zustand store (UI state only, never tokens)        │
│  - All /api/* / /server-request calls go through fetchWithAuth()          │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTPS (HttpOnly cookies travel automatically)
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                NEXT.JS 16 (Server Runtime, src/)                           │
│                                                                            │
│  Server Components / Server Actions / Route Handlers                      │
│  ──────────────────────────────────────────────────────                     │
│  getUser() ────► cookies() ──► jwtDecode(accessToken)                     │
│        │                                                                  │
│        └─► if expired → refreshManager.refresh() → ONE backend call       │
│                                                                            │
│  fetchWithAuth() (server) ──► 401? refreshManager.refresh() → retry once  │
│                                                                            │
│  Client fetch util ──► 401? POST /api/auth/refresh ──► retry once         │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Internal network / HTTPS
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     BACKEND (Express, port 5000)                          │
│                                                                            │
│  POST /api/auth/login        → sets HttpOnly access+refresh               │
│  POST /api/auth/refresh      → rotates tokens, marks session id           │
│  POST /api/auth/logout       → invalidates session id in DB               │
│  GET  /api/auth/me           → returns current user from access token     │
│  *   /api/...                → checks access JWT, role, etc.             │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          DATABASE (MySQL)                                  │
│  users · sessions(id, user_id, refresh_token_hash, expires_at, revoked)    │
└──────────────────────────────────────────────────────────────────────────┘
```

**The non-negotiable rule**: tokens live ONLY in HttpOnly cookies, set by the backend. Next.js never reads a token from anywhere except `cookies()` on the server, and never sends tokens in request bodies, query strings, or `localStorage`.

---

## §2 — Folder Structure

```
frontend/src/
├── proxy.ts                                    ← KEEP EMPTY or DELETE in prod
│
├── lib/
│   ├── auth/
│   │   ├── getUser.ts                          ← server-side "who am I?"
│   │   ├── refreshManager.ts                   ← ONE refresh for N callers
│   │   ├── refreshQueue.ts                     ← request-coalescer
│   │   └── types.ts                            ← AuthUser, JwtPayload, …
│   │
│   ├── api/
│   │   ├── server-fetch.ts                     ← auth-aware fetch for RSC / SA
│   │   └── client-fetch.ts                     ← auth-aware fetch for Client
│   │
│   ├── cookies.ts                              ← safe cookie helpers
│   └── …
│
├── action/
│   ├── auth.action.ts                          ← login, logout, register
│   └── session.action.ts                       ← refreshSession()
│
├── app/
│   ├── layout.tsx                              ← calls getUser() once
│   ├── page.tsx
│   │
│   ├── (passenger)/
│   │   ├── layout.tsx                          ← requires UserRole.passenger
│   │   └── …
│   ├── (operator)/
│   │   └── layout.tsx                          ← requires UserRole.operator
│   ├── (admin)/
│   │   └── layout.tsx                          ← requires UserRole.admin
│   │
│   └── api/auth/
│       ├── login/route.ts                      ← POST: forward to backend
│       ├── refresh/route.ts                   ← POST: re-issue tokens
│       ├── logout/route.ts                     ← POST: invalidate session
│       └── me/route.ts                         ← GET: return current user
│
├── hooks/
│   └── use-auth.ts                             ← client UI-state only
│
├── store/
│   └── auth-store.ts                           ← Zustand: user, isAuth, role
│
└── components/
    ├── auth/
    │   ├── login-form.tsx
    │   ├── auth-provider.tsx                  ← <SessionProvider>
    │   └── require-role.tsx
    └── shared/
        └── navbar.tsx
```

---

## §3 — Auth Flow Diagram (one picture)

```
         Client                       Next.js (server)              Backend
           │                                  │                          │
           │ 1. GET /                         │                          │
           │─────────────────────────────────►│                          │
           │                                  │ getUser()                │
           │                                  │   cookieStore.get(token)│
           │                                  │   expired? ──► R.refresh()│──────────►
           │                                  │                          │ POST /auth/refresh
           │                                  │◄──────── {new access+refresh} ────
           │                                  │ cookieStore.set(new)     │
           │                                  │ render HTML              │
           │◄──────────── HTML ───────────────│                          │
           │                                  │                          │
   button click (e.g. "View ticket")          │                          │
           │                                  │                          │
           │ 2. fetch("/api/bookings/123")     │                          │
           │ (cookies travel automatically)    │                          │
           │─────────────────────────────────►│                          │
           │                                  │ fetchWithAuth → backend  │
           │                                  │──────────────────────────► GET /bookings/123
           │                                  │              200 + data  │
           │                                  │◄─────────────────────────│
           │◄──────────── JSON ────────────────│                          │
           │                                  │                          │
   … time passes …                           │                          │
           │                                  │                          │
   admin page, 10 widgets                    │                          │
   all fetch at once with stale access token │                          │
           │                                  │                          │
           │ 3. fetch×10                      │                          │
           │─────────────────────────────────►│ (10 parallel Server Actions)
           │                                  │ all hit 401              │
           │                                  │ all call refreshManager  │
           │                                  │ ─┬─ ONE inflight Promise ┘
           │                                  │  ├─► 1 backend call only ◄───────
           │                                  │ ─┘                          │
           │                                  │ retry×10 → 10× 200          │
           │◄───────── JSON×10 ────────────────│                          │
```

**Case 3 from your brief is the heart of this design**. When 10 parallel callers hit 401, only **one** refresh fires, and all 10 callers wait on the same Promise. That's the refresh queue.

---

## §4 — Login Flow (server action)

```typescript
// src/action/auth.action.ts
"use server";

import { redirect } from "next/navigation";
import { backend } from "@/lib/api/server-fetch";
import { setCookie } from "@/lib/cookies";
import { revalidatePath } from "next/cache";

export type LoginResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

export async function loginAction(
  formData: FormData
): Promise<LoginResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const res = await backend.post<{
    accessToken: string;
    refreshToken: string;
    sessionId: string;
    user: { id: string; role: "passenger" | "operator" | "admin"; name: string };
  }>("/api/auth/login", { email, password });

  if (!res.ok) {
    return { ok: false, error: res.error ?? "Invalid credentials" };
  }

  // Set HttpOnly cookies on the current response.
  // These are MUTATION ALLOWED from a Server Action (it's a POST).
  await setCookie("accessToken", res.data.accessToken, 60 * 15);        // 15 min
  await setCookie("refreshToken", res.data.refreshToken, 60 * 60 * 24 * 7); // 7 days
  await setCookie("sessionId", res.data.sessionId, 60 * 60 * 24 * 7);
  await setCookie("userRole", res.data.user.role, 60 * 60 * 24 * 7);    // for nav rendering, non-sensitive
  await setCookie("userName", encodeURIComponent(res.data.user.name), 60 * 60 * 24 * 7);

  revalidatePath("/", "layout"); // force every segment to re-read getUser()

  const redirectTo = `/${res.data.user.role}`;
  return { ok: true, redirectTo };
}
```

Client-side consumption:

```tsx
"use client";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/action/auth.action";

export function LoginForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await loginAction(fd);
      if (res.ok) router.replace(res.redirectTo);
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
```

---

## §5 — Page Reload Flow (cold start, cookies present)

The browser sends `accessToken` + `refreshToken` cookies automatically.

1. Layout mounts → `<SessionProvider>` → calls `getUser()`.
2. `getUser()` reads `accessToken` cookie.
3. If present and not expired → `jwtDecode` → returns `AuthUser`. **Zero network calls.**
4. If expired AND refresh cookie present → calls `refreshManager.refresh()` → ONE backend POST → cookie rotation → returns user.
5. If refresh fails (refresh token expired/revoked) → return `null` → user lands on login page.

```
browser GET /
        │
        ▼
Server Component: layout.tsx
  ├─ getUser() ─► cookies().get("accessToken")
  │   │
  │   ├─ valid  ─► jwtDecode ─► AuthUser ──► render
  │   │
  │   └─ expired
  │       └─ refreshManager.refresh()
  │             │
  │             ├─ inflight Promise exists?  → await it
  │             └─ otherwise
  │                 ├─ POST /api/auth/refresh (Route Handler)
  │                 │     └─ POST backend /api/auth/refresh
  │                 │     └─ on success: setCookie(access+refresh)
  │                 └─ return decoded user
  │
  └─ render <Navbar user={...} />
```

---

## §6 — Initial SSR Flow (no cookies, first visit)

```
GET /                       no cookies
  │
  ▼
getUser() reads cookieStore → none
  │
  ▼
returns null
  │
  ▼
Layout renders with <SessionProvider user={null}>
  │
  ▼
Public homepage (search, browse schedules)
  │
  ▼
User clicks "Sign in" → modal opens → form posts to loginAction
```

---

## §7 — Client Request Flow (fetch from a Client Component)

```typescript
// src/lib/api/client-fetch.ts
"use client";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

async function refreshOnce(): Promise<boolean> {
  const r = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "same-origin",
  });
  return r.ok;
}

let refreshing: Promise<boolean> | null = null;

async function ensureFresh(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        return await refreshOnce();
      } finally {
        // keep the cached promise for THIS tick; the next 401 builds a new one
        setTimeout(() => { refreshing = null; }, 0);
      }
    })();
  }
  return refreshing;
}

export async function apiGet<T>(url: string): Promise<ApiResult<T>> {
  const doFetch = () => fetch(url, { credentials: "same-origin" });

  let res = await doFetch();
  if (res.status === 401) {
    const ok = await ensureFresh();
    if (ok) res = await doFetch();
  }
  return res.ok
    ? { ok: true, data: (await res.json()) as T }
    : { ok: false, status: res.status, error: await res.text().catch(() => "") };
}

export async function apiMutate<T, B = unknown>(
  url: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: B
): Promise<ApiResult<T>> {
  const doFetch = () =>
    fetch(url, {
      method,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });

  let res = await doFetch();
  if (res.status === 401) {
    const ok = await ensureFresh();
    if (ok) res = await doFetch();
  }
  return res.ok
    ? { ok: true, data: (await res.json()) as T }
    : { ok: false, status: res.status, error: await res.text().catch(() => "") };
}
```

**Key invariant**: only ONE `POST /api/auth/refresh` is in flight at a time on the client, even when 10 fetches come back 401 simultaneously.

---

## §8 — Server Component Request Flow

A Server Component that calls `fetch` to an internal route must use the **same** auth-aware fetch wrapper, because Server Components share the same request lifecycle as Server Actions.

```typescript
// src/lib/api/server-fetch.ts
import { cookies } from "next/headers";
import { refreshManager } from "@/lib/auth/refreshManager";

async function readCookiesHeader(): Promise<string> {
  const jar = await cookies();
  // Forward all cookies to the internal API.
  return jar
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

export async function serverFetch<T>(
  url: string,
  init: RequestInit & { method?: string; body?: unknown } = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("cookie", await readCookiesHeader());
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const doFetch = () =>
    fetch(`${process.env.INTERNAL_API_BASE ?? ""}${url}`, {
      ...init,
      headers,
      cache: "no-store",
    });

  let res = await doFetch();
  if (res.status === 401) {
    const ok = await refreshManager.refresh();
    if (ok) {
      headers.set("cookie", await readCookiesHeader());
      res = await doFetch();
    }
  }
  return res;
}

export const backend = {
  async get<T>(url: string) {
    const r = await serverFetch<T>(url, { method: "GET" });
    return okOrError<T>(r);
  },
  async post<T>(url: string, body: unknown) {
    const r = await serverFetch<T>(url, { method: "POST", body });
    return okOrError<T>(r);
  },
  // patch / put / delete as needed
};

function okOrError<T>(async resOrPromise: any) { /* ... */ }
```

> Note: For internal Next.js → Express traffic you may prefer to import the backend service layer directly (skip HTTP). This file is for when you must call back over HTTP (e.g. a Python microservice).

---

## §9 — Server Action Flow

Server Actions behave like Server Components w.r.t. cookies: they can **read** cookies but **write** only when invoked from a mutation context (POST / form submit). Inside `serverFetch` for an action, treat the 401-retry path identically.

---

## §10 — Refresh Queue Implementation

This is the file that solves **Case 3**.

```typescript
// src/lib/auth/refreshQueue.ts

/**
 * Coalesces concurrent refresh attempts into a single in-flight Promise.
 *
 * Semantics:
 *   - The FIRST caller within a single "epoch" runs the work function.
 *   - Every other caller within the same epoch AWAITS the same Promise.
 *   - When the work function resolves, the result is cached briefly so
 *     subsequent callers in the same event-loop tick reuse it.
 *   - After the cache TTL elapses, the next caller starts a new epoch.
 *
 * This is request-scoped (lives in module memory). Because Next.js can
 * horizontally scale Node workers, you ALSO need a server-side lock
 * (Redis SETNX) for true cross-instance deduplication — see §20.
 */
export class RefreshQueue<T> {
  private inflight: Promise<T> | null = null;
  private cachedAt = 0;
  private cachedValue: T | undefined;
  private readonly cacheTtlMs: number;

  constructor(cacheTtlMs = 250) {
    this.cacheTtlMs = cacheTtlMs;
  }

  /**
   * Run `work` if no refresh is currently in flight; otherwise await
   * the existing one. After success, the result is short-cached so
   * other callers in the same tick don't redundantly retry.
   */
  async run(work: () => Promise<T>): Promise<T> {
    const now = Date.now();

    // 1) Cached value still warm? Use it.
    if (
      this.cachedValue !== undefined &&
      now - this.cachedAt < this.cacheTtlMs
    ) {
      return this.cachedValue;
    }

    // 2) Already running? Join the queue.
    if (this.inflight) return this.inflight;

    // 3) Become the leader.
    this.inflight = (async () => {
      try {
        const v = await work();
        this.cachedValue = v;
        this.cachedAt = Date.now();
        return v;
      } finally {
        this.inflight = null;
      }
    })();

    return this.inflight;
  }

  /** Test-only: clear state. */
  reset() {
    this.inflight = null;
    this.cachedValue = undefined;
    this.cachedAt = 0;
  }
}
```

---

## §11 — Refresh Manager Implementation

This is the only thing the rest of the app calls to refresh tokens.

```typescript
// src/lib/auth/refreshManager.ts
import "server-only";
import { cookies } from "next/headers";
import { RefreshQueue } from "./refreshQueue";

type RefreshResult = { ok: true; user: AuthUser } | { ok: false };

declare global {
  // eslint-disable-next-line no-var
  var __refreshQueue:
    | { server: RefreshQueue<RefreshResult> }
    | undefined;
}

// Module-level singleton. Survives across requests inside the same Node worker.
const queue =
  globalThis.__refreshQueue?.server ??
  (globalThis.__refreshQueue = { server: new RefreshQueue<RefreshResult>(500) });

const REFRESH_PATH = "/api/auth/refresh";

export const refreshManager = {
  /**
   * Returns `{ ok: true }` when a fresh user is available (and has rotated
   * the cookies on the response), or `{ ok: false }` when the refresh
   * token was rejected.
   *
   * Safe to call concurrently: only one POST /api/auth/refresh is in
   * flight at a time, and additional callers piggy-back on the leader.
   */
  async refresh(): Promise<RefreshResult> {
    return queue.server.run(async () => {
      const cookieJar = await cookies();
      const refreshToken = cookieJar.get("refreshToken")?.value;
      const sessionId = cookieJar.get("sessionId")?.value;
      if (!refreshToken || !sessionId) return { ok: false };

      // Forward to the Route Handler that performs the actual backend call
      // and rotates the cookies on the current response.
      const origin =
        process.env.NEXTAUTH_URL ??
        (process.env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : "");
      const res = await fetch(`${origin}${REFRESH_PATH}`, {
        method: "POST",
        headers: {
          cookie: cookieJar
            .getAll()
            .map((c) => `${c.name}=${c.value}`)
            .join("; "),
        },
        cache: "no-store",
      });

      if (!res.ok) return { ok: false };

      // The Route Handler has already mutated our response cookies.
      // Re-read the access token and decode to verify.
      const newAccess = cookieJar.get("accessToken")?.value;
      if (!newAccess) return { ok: false };

      try {
        const user = jwtDecode<AuthUser>(newAccess);
        return { ok: true, user };
      } catch {
        return { ok: false };
      }
    });
  },
};
```

---

## §12 — Route Handler Implementation

The route handler is the ONE place where cookie mutation is always permitted (request → response). When `proxy.ts` is removed entirely, the route handler becomes the system of record for token rotation.

```typescript
// src/app/api/auth/refresh/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:5000";

export async function POST(req: Request) {
  const jar = await cookies();
  const refreshToken = jar.get("refreshToken")?.value;
  const sessionId = jar.get("sessionId")?.value;
  if (!refreshToken || !sessionId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // Forward to backend.
  const r = await fetch(`${BACKEND}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken, sessionId }),
    cache: "no-store",
  });

  if (!r.ok) {
    // Refresh failed → clear cookies on the response.
    const out = NextResponse.json({ ok: false }, { status: 401 });
    out.cookies.delete("accessToken");
    out.cookies.delete("refreshToken");
    out.cookies.delete("sessionId");
    return out;
  }

  const data = (await r.json()) as {
    accessToken: string;
    refreshToken: string;
    sessionId: string;
  };

  const out = NextResponse.json({ ok: true });
  const isProd = process.env.NODE_ENV === "production";
  const cookieOpts = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
  };
  out.cookies.set("accessToken", data.accessToken,  { ...cookieOpts, maxAge: 60 * 15 });
  out.cookies.set("refreshToken", data.refreshToken, { ...cookieOpts, maxAge: 60 * 60 * 24 * 7 });
  out.cookies.set("sessionId", data.sessionId,       { ...cookieOpts, maxAge: 60 * 60 * 24 * 7 });
  return out;
}
```

The matching `/api/auth/login` and `/api/auth/logout` route handlers follow the same pattern.

---

## §13 — API Client Implementation

Already shown in §7 (`client-fetch.ts`). Quick checklist:

- ✅ `credentials: "same-origin"` always
- ✅ Cookies are never put in headers, body, or query string
- ✅ 401 → exactly-one refresh, then retry once
- ✅ Hard failure → `apiGet/apiMutate` returns `{ ok: false }`, caller decides
- ✅ No `localStorage` / `sessionStorage` / `document.cookie` anywhere

---

## §14 — Retry Implementation

Server side (server-fetch.ts in §8) and client side (client-fetch.ts in §7) both share the same pattern: **refresh once, retry once**. Anything beyond that is treated as a real auth failure.

```typescript
// Pseudocode of the universal rule
async function authedFetch(doFetch: () => Promise<Response>): Promise<Response> {
  let res = await doFetch();
  if (res.status !== 401) return res;

  const refreshed = await refreshManager.refresh();         // coalesced
  if (!refreshed.ok) return res;                            // caller sees 401

  return doFetch();                                         // ONE retry
}
```

Don't loop. Two attempts max. If both fail, the user is genuinely logged out.

---

## §15 — Cookie Implementation

Already present in your `src/lib/cookies.ts` — keep it. The two important rules to enforce:

1. **Server Action render path**: `cookies().set` throws `CookieMutationContextError`. Your helper swallows only that specific error (already done correctly).
2. **HttpOnly + Secure + SameSite=Lax** for `accessToken`, `refreshToken`, `sessionId`. Non-sensitive flags (`userRole`, `userName`) can be non-HttpOnly for fast navbar rendering — never put anything sensitive there.

---

## §16 — Sequence Diagrams

### Login

```
Client            Next.js (SA)        /api/auth/login        Backend
  │  submit form      │                    │                    │
  ├───────────────────►│                    │                    │
  │                    │ POST /api/auth/login                    │
  │                    ├───────────────────►│ POST /auth/login    │
  │                    │                    ├───────────────────►│
  │                    │                    │ access+refresh     │
  │                    │◄───────────────────┤◄───────────────────┤
  │                    │ 200                │                    │
  │                    │ setCookie×3        │                    │
  │                    │ revalidatePath     │                    │
  │  {ok:true,redirect}│                    │                    │
  │◄───────────────────┤                    │                    │
  │  router.replace    │                    │                    │
```

### Reload with valid token

```
Browser                  Next.js (RSC)                Backend
  │  GET /                  │                            │
  ├────────────────────────►│                            │
  │                         │ getUser()                  │
  │                         │  cookies().get("access")   │
  │                         │  jwtDecode → AuthUser      │
  │                         │  render                    │
  │◄──────── HTML ──────────┤                            │
  │  zero backend calls     │                            │
```

### 10 parallel 401s

```
SA-1  SA-2  SA-3  …  SA-10     refreshManager          /api/auth/refresh     Backend
  │     │     │         │              │                       │                  │
  ├──► 401   │         │              │                       │                  │
  ├──►refresh├─►join──► │                                       │                  │
  │   ▼      │  ▼      │              │                       │                  │
  │   └──────┴──┴──┐   │              │                       │                  │
  │                 │   │              │                       │                  │
  │            (queue.run starts) ────►│                       │                  │
  │                                     ├── POST refresh ────►├─ POST refresh ──►│
  │                                     │                       │ 200 + new tokens │
  │                                     │◄──────────────────────┤◄─────────────────┤
  │            (all 10 await same Promise, then resolve)        │                  │
  │                                                             │                  │
  ├── retry ──►200 ──┐                                            │                  │
  ├── retry ──►200 ──┤                                            │                  │
  ├── retry ──►200 ──┤ (single refresh, single backend hit)       │                  │
```

---

## §17 — Edge Cases

| Case | Behavior |
|------|----------|
| Access token expired, refresh cookie present | `getUser()` calls `refreshManager.refresh()` → ONE backend call → cookies rotated → user returned |
| Access token expired, refresh cookie missing | `getUser()` returns `null` → layout renders logged-out view |
| Refresh cookie present but revoked (e.g. logged out elsewhere) | Backend returns 401 → cookies cleared on response → `getUser()` returns `null` |
| 10 parallel server-side calls hit 401 | `RefreshQueue` collapses to ONE backend refresh; all 10 retries succeed |
| 10 parallel client-side fetches hit 401 | Client `refreshing` Promise coalesces to ONE `POST /api/auth/refresh` |
| Cold start, both cookies present | `getUser()` decodes access token → zero backend calls |
| Cold start, no cookies | `getUser()` returns `null` → public homepage |
| Clock skew between server and client JWT leeway | 30 s leeway (`REFRESH_LEEWAY_SECONDS`) prevents false-expiry loops |
| `getUser()` called inside a Server Action vs a Server Component render path | Both call the same `refreshManager`. SA mutation context allows `cookies().set`; render path uses `/api/auth/refresh` to rotate. |
| User logs out from a second tab | Backend marks `session.id` revoked → other tab's next refresh 401s → cookies cleared |
| Backend down during refresh | `refreshManager.refresh()` returns `{ ok: false }` → user lands on login screen; no infinite retry loops |
| Server Action called from a route group layout | `getUser()` caches per-render via React `cache()`; the layout's call + the SA's call share one fetch |
| `Authorization` header or query-string token leaks | NEVER used. Tokens are cookies only. |

---

## §18 — Production Best Practices

1. **Backend issues two tokens**: short access (10–15 min) + long refresh (7–30 days). Backend stores `session.id → refresh_token_hash, user_id, expires_at, revoked_at` per session.
2. **Always hash refresh tokens** in DB (SHA-256). Compare hash-on-read.
3. **Always rotate** the refresh token on each refresh (one-time-use or sliding window). Mark old session revoked.
4. **`SameSite=Lax`** by default; use `Strict` if the app is fully embedded (no cross-site links into auth).
5. **`Secure`** always in production. `HttpOnly` always for tokens.
6. **CSRF**: since cookies are `SameSite=Lax`, CSRF is mostly handled, but add a custom request header (`X-Requested-With: fetch`) on mutating routes to be safe.
7. **Clock skew**: 30-second JWT leeway.
8. **Rate-limit `/api/auth/refresh`** and `/api/auth/login` on the backend (per IP + per `session.id`).
9. **Audit log** every login / refresh / logout with `session.id`, IP, user-agent.
10. **Don't ship `proxy.ts`** to prod if it's only running `NextResponse.next()`. Delete it. (See §19.)
11. **Don't set `process.env`-based secrets in runtime browser code.** Only the server reads them.
12. **Version your auth state**: bump a `authVersion` cookie if you ever rotate signing keys — `getUser()` checks it and forces a re-login.
13. **Server Actions must never echo tokens in their return value.** Return `{ ok, redirectTo }`, not the JWT.
14. **Always revalidate** after login/logout: `revalidatePath("/", "layout")`.

---

## §19 — Common Mistakes (and what to do instead)

| Mistake | Fix |
|---------|-----|
| Using `middleware.ts` / `proxy.ts` to gate routes | Use `<SessionProvider>` + per-route-group `layout.tsx` server components that call `getUser()` and call `redirect()` if unauthorized |
| Storing tokens in `localStorage` | Tokens belong only in HttpOnly cookies |
| Calling `refresh()` directly from 10 callers | Use `refreshManager.refresh()` — it wraps `RefreshQueue` automatically |
| Reading `Authorization` header on Next.js routes | Cookies travel automatically on same-origin fetch; headers are unnecessary and leak to non-Next layers |
| Calling `cookies().set` in a Server Component render | Throw `CookieMutationContextError` → use a Route Handler (`/api/auth/*`) instead |
| Returning the raw JWT from a Server Action | Return `{ ok, redirectTo, user }` only; tokens stay in cookies |
| Trusting `exp` to the second | Use `REFRESH_LEEWAY_SECONDS = 30` |
| Trying to extend a refresh token by re-decoding | Refresh is server-side. The cookie rotation step is required. |
| Looping retries on 401 | One refresh + one retry — full stop |
| Logging out by deleting only `accessToken` | Delete all three: `accessToken`, `refreshToken`, `sessionId` — otherwise backend keeps treating the session as live |
| Putting `proxy.ts` matcher `((?!_next/static|...).*)` that catches `/` | Tighten matcher or delete the file. Already costing you ~192 ms/req. |
| Skipping `runtime = "nodejs"` on the refresh Route Handler | Required if you use `cookies()` (sync) or Node-only crypto |
| Caching a 200 response with `cache: "force-cache"` | Use `cache: "no-store"` on every auth-aware fetch |
| Hoping `useAuth()` will hydrate tokens | It can't and mustn't. It hydrates `AuthUser` only (id, name, role, email). |
| Relying on `<SessionProvider>` to do refresh | Use the manager explicitly inside server fetches |
| Letting a Server Action return the access token to the client | Tokens must NEVER cross the server↔client boundary. Period. |

### Replace your `proxy.ts` immediately

```typescript
// src/proxy.ts — DELETE this file once you confirm zero references.
// If you must keep a proxy for some unrelated concern, use this minimal,
// non-greedy matcher:
import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: [
    // Match /admin, /operator, /api/*, /booking/* — NOT the root.
    "/admin/:path*",
    "/operator/:path*",
    "/api/:path*",
  ],
};

export function proxy(_req: NextRequest) {
  return NextResponse.next();
}
```

---

## §20 — Enterprise Improvements

1. **Singleflight at the Redis layer**

   When Next.js runs as multiple Node workers / multiple containers, the in-process RefreshQueue dedupes per worker only. Add a server-side lock for true cross-instance coalescing:

   ```typescript
   // pseudo
   const lockKey = "auth:refresh:leader";
   const lockToken = crypto.randomUUID();
   const acquired = await redis.set(lockKey, lockToken, "NX", "PX", 5000);
   if (acquired) {
     try { await doRefresh(); }
     finally { await redis.eval(LUA_RELEASE, 1, lockKey, lockToken); }
   } else {
     // poll until cache is filled
     for (let i = 0; i < 30; i++) {
       const cached = await redis.get("auth:refresh:result");
       if (cached) return JSON.parse(cached);
       await sleep(100);
     }
   }
   ```

2. **Refresh-result Redis cache** (5–10 s TTL) so even across workers the second caller avoids a backend call.

3. **Per-session fan-out**: instead of one refresh API, the backend can broadcast token rotation to all active sessions of the same user via WebSocket / SSE — for password changes and "log out everywhere" flows.

4. **Edge case: service-to-service auth**: when Next.js → backend is internal, send a service-to-service JWT in a header, NOT the user's cookie. Reserve the user cookie for browser-originated calls.

5. **Observability**

   - Emit `auth.refresh.start` / `auth.refresh.success` / `auth.refresh.fail` from `refreshManager.refresh()`.
   - Sample 1 % of failed refreshes with full headers (minus cookies) for diagnosing clock skew, proxy stripping, etc.
   - Track `auth.refresh.coalesced_count` to prove the queue is doing its job.

6. **Distributed session inventory**

   - DB column `users.active_sessions_count` maintained by triggers on `sessions` table.
   - Cap at e.g. 5 — oldest evicted.

7. **Threat model**

   - XSS → tokens are HttpOnly → no JS access.
   - CSRF → `SameSite=Lax` + custom header on mutating routes → mitigated.
   - Token theft from logs → never log cookies. Add a sanitizer that strips `cookie`, `Authorization`, `set-cookie` from log lines.
   - Stolen refresh token → server-side revocation list + sliding rotation + DB `revoked_at` enforcement.

8. **Graceful degradation**

   - Refresh endpoint down → return a synthetic `logged-out` state and show a banner: "Session expired, please sign in again."
   - Backend down → cache last-known user for 30 s with a soft "we couldn't verify your session" indicator.

9. **Schema migration plan**

   - Add `sessions.id` (UUID), `sessions.refresh_token_hash`, `sessions.expires_at`, `sessions.revoked_at`, `sessions.user_agent`, `sessions.ip`.
   - Migrate any pre-existing token table to the new shape behind a feature flag.

10. **Per-page authz**

    - A `<RequireRole role="admin">` server-component helper, not a hook, that calls `getUser()` and `redirect("/login")` if the role doesn't match.
    - Co-locate it inside each route group `(admin)/layout.tsx`, `(operator)/layout.tsx`, etc.

---

## Appendix A — Files to Drop In

| File | Replaces |
|------|----------|
| `src/lib/auth/refreshQueue.ts` | new |
| `src/lib/auth/refreshManager.ts` | new |
| `src/lib/api/server-fetch.ts` | new (or augment existing `lib/api.ts`) |
| `src/lib/api/client-fetch.ts` | new |
| `src/app/api/auth/refresh/route.ts` | keep your existing one, ensure `runtime = "nodejs"` |
| `src/app/api/auth/login/route.ts` | keep |
| `src/app/api/auth/logout/route.ts` | keep |
| `src/lib/auth/getUser.ts` | keep your existing one; add `RefreshQueue` semantics |
| `src/proxy.ts` | tighten matcher OR delete |

## Appendix B — Minimal `getUser.ts` (final shape)

```typescript
"use server";
import { cookies } from "next/headers";
import { cache } from "react";
import { jwtDecode } from "jwt-decode";
import { refreshManager } from "@/lib/auth/refreshManager";
import type { UserRole } from "@/lib/types";

export type AuthUser = {
  userId: string;
  role: UserRole;
  name?: string;
  email: string;
};

type JwtPayload = AuthUser & { exp?: number };

const LEeway = 30;
const expired = (t: string) => {
  try {
    const { exp } = jwtDecode<JwtPayload>(t);
    if (typeof exp !== "number") return true;
    return exp - Math.floor(Date.now() / 1000) <= LEeway;
  } catch { return true; }
};

const _getUser = cache(async (): Promise<AuthUser | null> => {
  const jar = await cookies();
  let token = jar.get("accessToken")?.value;

  if (!token || expired(token)) {
    const result = await refreshManager.refresh();
    if (!result.ok) return null;
    token = jar.get("accessToken")?.value;
    if (!token) return null;
  }

  try { return jwtDecode<AuthUser>(token); }
  catch { return null; }
});

export async function getUser() { return _getUser(); }
```

## Appendix C — Layout Pattern Per Role

```typescript
// src/app/(admin)/layout.tsx
import { getUser } from "@/lib/auth/getUser";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect(`/${user.role}`);
  return <>{children}</>;
}
```

Repeat for `(operator)` and `(passenger)`. The root `layout.tsx` does NOT redirect — it just hydrates `<SessionProvider>` so the public homepage works.

---

## TL;DR

- **No middleware, no proxy.** Use per-route-group server-component layouts + `getUser()`.
- **Tokens live ONLY in HttpOnly cookies**, set by the backend. Next.js reads them with `cookies()` on the server, never on the client.
- **One refresh, many callers**, via `RefreshQueue` on the server and a coalesced Promise on the client.
- **`refreshManager.refresh()`** is the single entry point for "renew tokens".
- **One refresh + one retry** on every 401. Never loop.
- **Delete `proxy.ts`** (or at least remove it from the matcher for `/`) — it's costing 192 ms per request today.
- **Hard reload + Console check** for the loading symptom. The server is not hanging.
