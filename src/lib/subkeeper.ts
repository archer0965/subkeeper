export const HUB_URL =
  process.env.NEXT_PUBLIC_HUB_URL || "https://paycheck.com.de";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://temporary-speedy-reef-cy4xhhu.vercel.app";

export const SUBKEEPER = {
  /** User-visible product name — always「訂閱管家」(never English brand in UI). */
  name: "訂閱管家",
  hubUrl: HUB_URL,
  siteUrl: SITE_URL,
  loginHref: "/login?next=%2Fapp",
  signupHref: "/signup?next=%2Fapp",
  accountSettingsUrl: `${HUB_URL}/dashboard`,
  /** Internal localStorage key for pre-NovaOS offline cache (not shown in UI). */
  legacyStorageKey: "subkeeper-subscriptions-v1",
  matrixProducts: [
    { name: "NovaOS 主站", href: HUB_URL },
    { name: "NovaStore", href: "https://novastore-omega.vercel.app" },
    { name: "拓脈預約", href: "https://taiwanbiz.vercel.app" },
    { name: "Nova商譽寶", href: "https://paycheck.com.de/novashield" },
    { name: "拓維空間", href: "https://novadimension.vercel.app" },
  ],
} as const;

export type PersonalBillingCycle = "monthly" | "yearly" | "weekly" | "custom";

export type DisplayCurrency = "TWD" | "USD" | "JPY";

export type UsageLevel = "常用" | "普通" | "很少用";

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

/** Category presets for 訂閱服務分類 */
export const CATEGORY_PRESETS = [
  "影音",
  "軟體",
  "雲端",
  "音樂",
  "新聞",
  "其他",
] as const;

export const USAGE_OPTIONS: UsageLevel[] = ["常用", "普通", "很少用"];

/** Fixed display rates: 1 USD / 1 JPY → TWD (approx.). TWD is authoritative. */
export const DISPLAY_RATES_TO_TWD: Record<DisplayCurrency, number> = {
  TWD: 1,
  USD: 32,
  JPY: 0.21,
};

/** Official cancel-help URLs for known services */
export const CANCEL_HELP_URLS: Array<{ match: RegExp; label: string; url: string }> = [
  {
    match: /netflix/i,
    label: "Netflix 取消說明",
    url: "https://help.netflix.com/zh-tw/node/407",
  },
  {
    match: /spotify/i,
    label: "Spotify 取消說明",
    url: "https://support.spotify.com/tw/article/cancel-premium/",
  },
  {
    match: /adobe/i,
    label: "Adobe 取消說明",
    url: "https://helpx.adobe.com/tw/manage-account/using/cancel-subscription.html",
  },
  {
    match: /youtube|yt\s*premium/i,
    label: "YouTube Premium 取消說明",
    url: "https://support.google.com/youtube/answer/6308116?hl=zh-Hant",
  },
  {
    match: /apple|icloud|apple\s*music|apple\s*tv/i,
    label: "Apple 訂閱取消說明",
    url: "https://support.apple.com/zh-tw/HT202039",
  },
  {
    match: /google|google\s*one|google\s*play/i,
    label: "Google 訂閱取消說明",
    url: "https://support.google.com/googleplay/answer/7018481?hl=zh-Hant",
  },
];

export function monthlyEquivalent(
  amount: number,
  cycle: PersonalBillingCycle,
): number {
  if (cycle === "yearly") return Math.round(amount / 12);
  if (cycle === "weekly") return Math.round((amount * 52) / 12);
  return amount;
}

/** Yearly projection from the same monthlyEquivalent basis (×12). */
export function yearlyEquivalent(
  amount: number,
  cycle: PersonalBillingCycle,
): number {
  return monthlyEquivalent(amount, cycle) * 12;
}

export function formatMoney(amount: number, currency: DisplayCurrency = "TWD"): string {
  const rounded = Math.round(amount);
  if (currency === "USD") {
    return `US$${rounded.toLocaleString("en-US")}`;
  }
  if (currency === "JPY") {
    return `¥${rounded.toLocaleString("ja-JP")}`;
  }
  return `NT$${rounded.toLocaleString("zh-TW")}`;
}

/** Convert a TWD amount into a display currency using fixed rates. */
export function twdToDisplay(amountTwd: number, currency: DisplayCurrency): number {
  const rate = DISPLAY_RATES_TO_TWD[currency] || 1;
  if (currency === "TWD") return amountTwd;
  return Math.round(amountTwd / rate);
}

const CURRENCY_RE = /\[currency:(TWD|USD|JPY)\]/i;
const USAGE_RE = /\[usage:(常用|普通|很少用)\]/;
const PRICE_WATCH_TAG = "[price_watch]";

export type NotesMeta = {
  currency: DisplayCurrency;
  usage: UsageLevel | null;
  priceWatch: boolean;
  freeText: string;
};

export function parseNotesMeta(notes: string | null | undefined): NotesMeta {
  const raw = notes || "";
  const currencyMatch = raw.match(CURRENCY_RE);
  const usageMatch = raw.match(USAGE_RE);
  const priceWatch =
    raw.includes(PRICE_WATCH_TAG) || /漲價/.test(raw);
  const freeText = raw
    .replace(CURRENCY_RE, "")
    .replace(USAGE_RE, "")
    .replace(PRICE_WATCH_TAG, "")
    .replace(/\s*·\s*/g, " · ")
    .replace(/^[\s·]+|[\s·]+$/g, "")
    .trim();
  return {
    currency: (currencyMatch?.[1]?.toUpperCase() as DisplayCurrency) || "TWD",
    usage: (usageMatch?.[1] as UsageLevel) || null,
    priceWatch,
    freeText,
  };
}

export function buildNotes(opts: {
  currency?: DisplayCurrency;
  usage?: UsageLevel | "" | null;
  priceWatch?: boolean;
  freeText?: string;
}): string | null {
  const parts: string[] = [];
  const currency = opts.currency || "TWD";
  if (currency !== "TWD") parts.push(`[currency:${currency}]`);
  if (opts.usage) parts.push(`[usage:${opts.usage}]`);
  if (opts.priceWatch) parts.push(PRICE_WATCH_TAG);
  const text = (opts.freeText || "").trim();
  if (text) parts.push(text);
  return parts.length ? parts.join(" · ") : null;
}

export function isLowUsage(notes: string | null | undefined, usage?: UsageLevel | null): boolean {
  if (usage === "很少用") return true;
  const raw = notes || "";
  return /很少用|不常用|不常使用/.test(raw);
}

export function daysUntil(dateStr: string | null | undefined, now = new Date()): number | null {
  if (!dateStr) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const target = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value]),
  );
  const today = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
  return Math.round((target - today) / 86_400_000);
}

export function isDueSoon(item: PersonalSubscription, now = new Date()): boolean {
  if (!item.is_active || !item.next_billing_on) return false;
  const days = daysUntil(item.next_billing_on, now);
  if (days === null) return false;
  return days >= 0 && days <= (item.reminder_days ?? 3);
}

export function cancelHelpFor(name: string): { label: string; url: string } {
  for (const entry of CANCEL_HELP_URLS) {
    if (entry.match.test(name)) {
      return { label: entry.label, url: entry.url };
    }
  }
  return {
    label: "搜尋取消訂閱說明",
    url: `https://www.google.com/search?q=${encodeURIComponent(`${name} 取消訂閱`)}`,
  };
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

export function subscriptionsToCsv(items: PersonalSubscription[]): string {
  const header = [
    "id",
    "name",
    "amount_twd",
    "billing_cycle",
    "next_billing_on",
    "reminder_days",
    "category",
    "notes",
    "is_active",
    "created_at",
    "updated_at",
  ];
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const rows = items.map((i) =>
    [
      i.id,
      i.name,
      i.amount_twd,
      i.billing_cycle,
      i.next_billing_on,
      i.reminder_days,
      i.category,
      i.notes,
      i.is_active,
      i.created_at,
      i.updated_at,
    ]
      .map(escape)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function downloadBlob(filename: string, content: string, mime: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
