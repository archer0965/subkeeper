import { SUBKEEPER } from "@/lib/subkeeper";

export const SUBKEEPER_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  SUBKEEPER.siteUrl ||
  "https://temporary-speedy-reef-cy4xhhu.vercel.app";

export function hubAuthRedirect(
  mode: "login" | "signup",
  nextPath = "/app"
): string {
  const next = nextPath.startsWith("/") ? nextPath : "/app";
  const returnTo = `${SUBKEEPER_ORIGIN}/auth/receive?next=${encodeURIComponent(next)}`;
  const hub = SUBKEEPER.hubUrl.replace(/\/$/, "");
  return `${hub}/${mode}?next=${encodeURIComponent(returnTo)}`;
}
