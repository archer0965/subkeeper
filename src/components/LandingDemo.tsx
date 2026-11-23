"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  CYCLE_LABELS,
  cn,
  daysUntil,
  formatMoney,
  isDueSoon,
  monthlyEquivalent,
  yearlyEquivalent,
  type PersonalBillingCycle,
} from "@/lib/subkeeper";

/** Privacy-safe fake sample rows — no real emails, phones, or account ids. */
type DemoItem = {
  id: string;
  name: string;
  amount_twd: number;
  billing_cycle: PersonalBillingCycle;
  next_billing_on: string;
  reminder_days: number;
  category: string;
  is_active: boolean;
};

function taipeiYmd(offsetDays: number): string {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value]),
  );
  const base = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
  );
  const d = new Date(base + offsetDays * 86_400_000);
  return d.toISOString().slice(0, 10);
}

const SAMPLE_SEED: DemoItem[] = [
  {
    id: "demo-stream",
    name: "影音串流（示範）",
    amount_twd: 390,
    billing_cycle: "monthly",
    next_billing_on: taipeiYmd(2),
    reminder_days: 3,
    category: "影音",
    is_active: true,
  },
  {
    id: "demo-music",
    name: "音樂訂閱（示範）",
    amount_twd: 149,
    billing_cycle: "monthly",
    next_billing_on: taipeiYmd(12),
    reminder_days: 3,
    category: "音樂",
    is_active: true,
  },
  {
    id: "demo-cloud",
    name: "雲端空間（示範）",
    amount_twd: 2190,
    billing_cycle: "yearly",
    next_billing_on: taipeiYmd(40),
    reminder_days: 7,
    category: "雲端",
    is_active: true,
  },
  {
    id: "demo-news",
    name: "新聞雜誌（示範）",
    amount_twd: 99,
    billing_cycle: "monthly",
    next_billing_on: taipeiYmd(1),
    reminder_days: 3,
    category: "新聞",
    is_active: false,
  },
];

export function LandingDemo() {
  const [items, setItems] = useState<DemoItem[]>(SAMPLE_SEED);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const active = useMemo(() => items.filter((i) => i.is_active), [items]);

  const monthly = useMemo(
    () =>
      active.reduce(
        (sum, i) => sum + monthlyEquivalent(i.amount_twd, i.billing_cycle),
        0,
      ),
    [active],
  );

  const yearly = useMemo(
    () =>
      active.reduce(
        (sum, i) => sum + yearlyEquivalent(i.amount_twd, i.billing_cycle),
        0,
      ),
    [active],
  );

  const dueSoon = useMemo(
    () =>
      items.filter((i) =>
        isDueSoon({
          ...i,
          user_id: "demo",
          notes: null,
          created_at: "",
          updated_at: "",
        }),
      ),
    [items],
  );

  function toggleActive(id: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_active: !i.is_active } : i)),
    );
    setHighlightId(id);
  }

  function resetDemo() {
    setItems(SAMPLE_SEED.map((i) => ({ ...i })));
    setHighlightId(null);
  }

  return (
    <section
      id="demo"
      className="mt-12 w-full max-w-lg rounded-3xl border border-white/10 bg-[#0c121a] p-5 shadow-[0_0_0_1px_rgba(45,212,191,0.06)]"
      aria-labelledby="demo-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-teal-300/90">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            互動 Demo · 假資料
          </p>
          <h2
            id="demo-title"
            className="mt-1 text-lg font-semibold text-white"
          >
            試試月費與到期提醒
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            以下為虛構示範項目（不含真實個資）。點「暫停／啟用」即時重算每月合計與到期提醒；登入後才會雲端保存你的真實清單。
          </p>
        </div>
        <button
          type="button"
          onClick={resetDemo}
          className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-white/10 px-2.5 py-1.5 text-[11px] text-slate-400 hover:bg-white/5 hover:text-slate-200"
        >
          <RotateCcw className="h-3 w-3" aria-hidden />
          重設
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-teal-400/20 bg-teal-400/10 px-3 py-3">
          <p className="text-[11px] text-teal-200/70">每月合計</p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-teal-200">
            {formatMoney(monthly, "TWD")}
          </p>
        </div>
        <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-3 py-3">
          <p className="text-[11px] text-sky-200/70">年度推估</p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-sky-200">
            {formatMoney(yearly, "TWD")}
          </p>
        </div>
      </div>

      {dueSoon.length > 0 ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
          <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <p>
            即將扣款：
            {dueSoon
              .map((i) => {
                const d = daysUntil(i.next_billing_on);
                const label = i.name.replace("（示範）", "");
                if (d === 0) return `${label}（今天）`;
                if (d !== null) return `${label}（${d} 天）`;
                return label;
              })
              .join("、")}
          </p>
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-slate-500">
          目前沒有在提醒天數內的示範扣款。
        </div>
      )}

      <ul className="mt-4 space-y-2">
        {items.map((item) => {
          const monthlyEq = monthlyEquivalent(
            item.amount_twd,
            item.billing_cycle,
          );
          const due = daysUntil(item.next_billing_on);
          return (
            <li
              key={item.id}
              className={cn(
                "flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 transition",
                highlightId === item.id && "ring-1 ring-teal-400/40",
                !item.is_active && "opacity-55",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {item.name}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {item.category} · {CYCLE_LABELS[item.billing_cycle]} · 月費等值{" "}
                  {formatMoney(monthlyEq, "TWD")}
                  {due !== null
                    ? due === 0
                      ? " · 今天扣款"
                      : ` · ${due} 天後`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleActive(item.id)}
                className={cn(
                  "inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[11px] font-medium",
                  item.is_active
                    ? "border border-white/10 text-slate-300 hover:bg-white/5"
                    : "bg-teal-400/20 text-teal-200 hover:bg-teal-400/30",
                )}
                aria-pressed={item.is_active}
              >
                {item.is_active ? (
                  <>
                    <Pause className="h-3 w-3" aria-hidden />
                    暫停
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" aria-hidden />
                    啟用
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
