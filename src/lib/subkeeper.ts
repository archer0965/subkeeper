export const HUB_URL =
  process.env.NEXT_PUBLIC_HUB_URL || "https://paycheck.com.de";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://temporary-speedy-reef-cy4xhhu.vercel.app";

export const SUBKEEPER = {
  name: "訂閱管家",
  nameEn: "Subscription Keeper",
  hubUrl: HUB_URL,
  siteUrl: SITE_URL,
  loginHref: "/login?next=%2Fapp",
  signupHref: "/signup?next=%2Fapp",
  legacyStorageKey: "subkeeper-subscriptions-v1",
  matrixProducts: [
    { name: "NovaOS 主站", href: HUB_URL },
    { name: "NovaStore", href: "https://novastore-omega.vercel.app" },
    { name: "拓脈預約", href: "https://taiwanbiz.vercel.app" },
    { name: "Nova商譽寶", href: "https://novashield-mauve.vercel.app" },
    { name: "拓維空間", href: "https://novadimension.vercel.app" },
  ],
} as const;

export type PersonalBillingCycle = "monthly" | "yearly" | "weekly" | "custom";

export type PersonalSubscription = {
  id: string;
  user_id: string;
  name: string;
  amount_twd: number;
  billing_cycle: PersonalBillingCycle;
  next_billing_on: string | null;
  reminder_days: number;
  category: string | null;
  notes: string | null;
  is_active: boolean;
  legacy_client_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type LegacySubkeeperItem = {
  id: string;
  name: string;
  amount: number;
  cycle?: string;
  billingDay?: number;
  status?: string;
  accent?: string;
};

export const CYCLE_LABELS: Record<PersonalBillingCycle, string> = {
  monthly: "月繳",
  yearly: "年繳",
  weekly: "週繳",
  custom: "其他",
};

export function monthlyEquivalent(
  amount: number,
  cycle: PersonalBillingCycle,
): number {
  if (cycle === "yearly") return Math.round(amount / 12);
  if (cycle === "weekly") return Math.round((amount * 52) / 12);
  return amount;
}

export function normalizeLegacyCycle(raw: unknown): PersonalBillingCycle {
  const v = String(raw || "monthly").toLowerCase();
  if (v === "yearly" || v === "year" || v === "annual") return "yearly";
  if (v === "weekly" || v === "week") return "weekly";
  if (v === "custom" || v === "other") return "custom";
  return "monthly";
}

export function nextBillingFromDay(billingDay: number, now = new Date()): string {
  const day = Math.min(31, Math.max(1, Math.floor(billingDay) || 1));
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value]),
  );
  let y = Number(parts.year);
  let m = Number(parts.month);
  const today = Number(parts.day);
  if (day < today) {
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const d = Math.min(day, dim);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function readLegacyLocalSubscriptions(): LegacySubkeeperItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SUBKEEPER.legacyStorageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is LegacySubkeeperItem =>
        Boolean(
          e &&
            typeof e === "object" &&
            typeof e.id === "string" &&
            typeof e.name === "string" &&
            typeof e.amount === "number",
        ),
    );
  } catch {
    return [];
  }
}

export function clearLegacyLocalSubscriptions() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SUBKEEPER.legacyStorageKey);
  } catch {
    /* ignore */
  }
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
