/**
 * Offline checks for NovaOS login handoff helpers.
 * Run: node scripts/verify-auth-receive.mjs
 */
import assert from "node:assert/strict";

function sanitizeNextPath(raw) {
  if (!raw) return "/app";
  const v = raw.trim();
  if (!v.startsWith("/") || v.startsWith("//") || v.includes("://")) {
    return "/app";
  }
  return v;
}

function parseHandoffHash(hash) {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw) return null;
  const params = new URLSearchParams(raw);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token };
}

function hubAuthRedirect(hubUrl, siteOrigin, mode, nextPath = "/app") {
  const next = nextPath.startsWith("/") ? nextPath : "/app";
  const returnTo = `${siteOrigin}/auth/receive?next=${encodeURIComponent(next)}`;
  const hub = hubUrl.replace(/\/$/, "");
  return `${hub}/${mode}?next=${encodeURIComponent(returnTo)}`;
}

assert.equal(sanitizeNextPath(null), "/app");
assert.equal(sanitizeNextPath("/app"), "/app");
assert.equal(sanitizeNextPath("/app/settings"), "/app/settings");
assert.equal(sanitizeNextPath("//evil.com"), "/app");
assert.equal(sanitizeNextPath("https://evil.com"), "/app");
assert.equal(sanitizeNextPath("app"), "/app");

assert.deepEqual(parseHandoffHash("#access_token=a&refresh_token=b"), {
  access_token: "a",
  refresh_token: "b",
});
assert.equal(parseHandoffHash("#access_token=only"), null);
assert.equal(parseHandoffHash(""), null);

const url = hubAuthRedirect(
  "https://paycheck.com.de",
  "https://temporary-speedy-reef-cy4xhhu.vercel.app",
  "login",
  "/app",
);
assert.ok(url.startsWith("https://paycheck.com.de/login?next="));
const nextParam = new URL(url).searchParams.get("next");
assert.equal(
  nextParam,
  "https://temporary-speedy-reef-cy4xhhu.vercel.app/auth/receive?next=%2Fapp",
);
const receive = new URL(nextParam);
assert.equal(receive.pathname, "/auth/receive");
assert.equal(receive.searchParams.get("next"), "/app");

console.log("verify-auth-receive: all assertions passed");
