/**
 * validate-refresh.mjs
 *
 * Standalone Node script that proves the /api/auth/refresh flow rotates
 * access and refresh tokens on every call.
 *
 *     node scripts/validate-refresh.mjs
 *
 * 1. POST to backend /api/auth/login directly to capture initial tokens.
 * 2. POST to NEXT /api/auth/refresh route twice, capturing rotated tokens
 *    each time. Going through Next also exercises proxy.ts request-snapshot
 *    rewrite path.
 * 3. Decode each accessToken and dump user claims (iat/exp).
 * 4. Verify:
 *      - accessToken rotates between refresh #1 and #2
 *      - refreshToken rotates between refresh #1 and #2
 *      - the FIRST refresh token is rejected on a later call
 *      - the userInfo cookie carries the expected claims
 *
 * Exit code 0 on success, 1 on any failure.
 *
 * Env vars (all optional):
 *   FRONTEND_BASE   default http://localhost:3000
 *   BACKEND_BASE    default http://localhost:5000
 *   LOGIN_EMAIL     default admin@example.com
 *   LOGIN_PASSWORD  default admin123
 */

const decodeJwt = (token) => {
  const part = token.split(".")[1];
  if (!part) throw new Error("malformed JWT");
  const b64 =
    part.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (part.length % 4)) % 4);
  return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
};

const FRONTEND_BASE = process.env.FRONTEND_BASE || "http://localhost:3000";
const BACKEND_BASE  = process.env.BACKEND_BASE  || "http://localhost:5000";
const EMAIL         = process.env.LOGIN_EMAIL   || "admin@example.com";
const PASSWORD      = process.env.LOGIN_PASSWORD || "admin123";

const GREEN  = "\u001b[32m";
const RED    = "\u001b[31m";
const CYAN   = "\u001b[36m";
const RESET  = "\u001b[0m";
const ok     = (m) => console.log(`${GREEN}OK${RESET}  ${m}`);
const bad    = (m) => { console.error(`${RED}FAIL${RESET} ${m}`); process.exitCode = 1; };
const info   = (m) => console.log(`${CYAN}..${RESET} ${m}`);

class Jar {
  constructor(seed = {}) { this.map = new Map(Object.entries(seed)); }
  set(name, value) { if (value == null) this.map.delete(name); else this.map.set(name, value); }
  get(name) { return this.map.get(name); }
  ingest(lines) {
    for (const line of lines || []) {
      const pair = line.split(";")[0];
      const eq = pair.indexOf("=");
      if (eq <= 0) continue;
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (value === "" || /deleted/i.test(value)) this.map.delete(name);
      else this.map.set(name, value);
    }
  }
  header() { return [...this.map.entries()].map(([k, v]) => `${k}=${v}`).join("; "); }
}

async function loginBackend() {
  const res = await fetch(`${BACKEND_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Login failed: ${res.status} ${t}`);
  }
  return res.json();
}

async function callNext(path, jar, body) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    cookie: jar.header(),
  };
  const res = await fetch(`${FRONTEND_BASE}${path}`, {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  jar.ingest(res.headers.getSetCookie ? res.headers.getSetCookie() : []);
  let json = null;
  try { json = await res.json(); } catch { /* swallow */ }
  return { status: res.status, json };
}

function summarize(label, access) {
  try {
    const d = decodeJwt(access);
    info(
      `${label}: userId=${d.userId || "?"} role=${d.role || "?"} ` +
      `iat=${d.iat || "?"} exp=${d.exp || "?"}`,
    );
  } catch {
    info(`${label}: <undecodable JWT>`);
  }
}

async function refreshOnce(jar) {
  return callNext("/api/auth/refresh", jar, {
    refreshToken: jar.get("refreshToken"),
    sessionId: jar.get("sessionId"),
  });
}

async function main() {
  info(`Validating refresh rotation against ${FRONTEND_BASE}`);
  info(`Backend: ${BACKEND_BASE}`);
  info(`Logging in as ${EMAIL} (direct to backend)`);

  const loginResp = await loginBackend();
  const loginAccess  = loginResp.accessToken;
  const loginRefresh = loginResp.refreshToken;
  const loginSession = loginResp.sessionId;

  if (!loginAccess || !loginRefresh || !loginSession) {
    throw new Error("Login response missing tokens");
  }
  summarize("login  accessToken", loginAccess);
  ok("login OK - captured initial tokens");

  const jar = new Jar({
    accessToken: loginAccess,
    refreshToken: loginRefresh,
    sessionId: loginSession,
  });

  // Refresh round 1
  info("Calling /api/auth/refresh (round 1)");
  const r1 = await refreshOnce(jar);
  if (r1.status !== 200 || !r1.json || !r1.json.success) {
    bad(`refresh #1 failed: HTTP ${r1.status} body=${JSON.stringify(r1.json)}`);
    return;
  }
  const a1 = jar.get("accessToken");
  const t1 = jar.get("refreshToken");
  summarize("round1 accessToken", a1);
  if (a1 === loginAccess) bad("round1 accessToken DID NOT rotate (same as login)");
  else ok("round1 accessToken rotated");
  if (t1 === loginRefresh) bad("round1 refreshToken DID NOT rotate");
  else ok("round1 refreshToken rotated");

  // Refresh round 2
  info("Calling /api/auth/refresh (round 2)");
  const r2 = await refreshOnce(jar);
  if (r2.status !== 200 || !r2.json || !r2.json.success) {
    bad(`refresh #2 failed: HTTP ${r2.status} body=${JSON.stringify(r2.json)}`);
    return;
  }
  const a2 = jar.get("accessToken");
  const t2 = jar.get("refreshToken");
  summarize("round2 accessToken", a2);
  if (a2 === a1) bad("round2 accessToken DID NOT rotate (same as round1)");
  else ok("round2 accessToken rotated");
  if (t2 === t1) bad("round2 refreshToken DID NOT rotate");
  else ok("round2 refreshToken rotated");

  // Re-use round1 refresh token to prove it's one-shot
  info("Re-using round1 refresh token (must be rejected)");
  const oldJar = new Jar({
    accessToken: a1,
    refreshToken: t1,
    sessionId: jar.get("sessionId"),
  });
  const rOld = await refreshOnce(oldJar);
  if (rOld.status >= 400 || (rOld.json && rOld.json.success === false)) {
    ok(
      `round1 refresh token correctly rejected (HTTP ${rOld.status} ` +
      `${JSON.stringify(rOld.json ? rOld.json.message || rOld.json : "<no body>")})`,
    );
  } else {
    bad(
      "round1 refresh token was ACCEPTED on a later call - rotation is NOT one-shot. " +
      `HTTP ${rOld.status} body=${JSON.stringify(rOld.json)}`,
    );
  }

  // userInfo cookie sanity
  const ui = jar.get("userInfo");
  if (!ui) {
    info("userInfo cookie not set on jar - skipped claim-by-claim check");
  } else {
    try {
      const decoded = JSON.parse(decodeURIComponent(ui).replace(/\+/g, " "));
      info(
        `userInfo cookie: userId=${decoded.userId} role=${decoded.role} ` +
        `name=${decoded.name == null ? "null" : decoded.name}`,
      );
      if (decoded.userId && decoded.role) ok("userInfo cookie has expected claims");
      else bad("userInfo cookie missing required claims");
    } catch {
      bad(`userInfo cookie present but not parseable: ${ui.slice(0, 60)}...`);
    }
  }

  if (process.exitCode) bad("VALIDATION FAILED - see errors above");
  else ok("VALIDATION PASSED - tokens rotate, old refresh is one-shot");
}

main().catch((e) => {
  console.error(`${RED}FAIL${RESET} Fatal:`, e && e.message ? e.message : e);
  process.exit(1);
});
