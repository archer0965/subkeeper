/** Relative path only — blocks open redirects. */
export function sanitizeNextPath(raw: string | null | undefined): string {
  if (!raw) return "/app";
  const v = raw.trim();
  if (!v.startsWith("/") || v.startsWith("//") || v.includes("://")) {
    return "/app";
  }
  return v;
}
