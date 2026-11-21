/** Parse hub handoff hash and persist Supabase session on the product origin. */

export function parseHandoffHash(hash: string): {
  access_token: string;
  refresh_token: string;
} | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw) return null;
  const params = new URLSearchParams(raw);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token };
}

export async function applyHandoffSession(supabase: {
  auth: {
    setSession: (s: {
      access_token: string;
      refresh_token: string;
    }) => Promise<{ data: { session: unknown }; error: Error | null }>;
    getSession: () => Promise<{
      data: { session: unknown };
    }>;
  };
}): Promise<boolean> {
  if (typeof window !== "undefined") {
    const tokens = parseHandoffHash(window.location.hash || "");
    if (tokens) {
      const { error } = await supabase.auth.setSession(tokens);
      if (!error) {
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search
        );
        return true;
      }
    }
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return Boolean(session);
}
