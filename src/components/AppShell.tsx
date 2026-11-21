"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Download,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { LegacyMigrate } from "@/components/LegacyMigrate";
import {
  cancelHelpFor,
  CATEGORY_PRESETS,
  CYCLE_LABELS,
  buildNotes,
  cn,
  daysUntil,
  downloadBlob,
  formatMoney,
  isDueSoon,
  isLowUsage,
  monthlyEquivalent,
  parseNotesMeta,
  SUBKEEPER,
  subscriptionsToCsv,
  twdToDisplay,
  USAGE_OPTIONS,
  yearlyEquivalent,
  type DisplayCurrency,
  type PersonalBillingCycle,
  type PersonalSubscription,
  type UsageLevel,
} from "@/lib/subkeeper";

const CYCLES: PersonalBillingCycle[] = [
  "monthly",
  "yearly",
  "weekly",
  "custom",
];

const CURRENCIES: DisplayCurrency[] = ["TWD", "USD", "JPY"];

type FormState = {
  name: string;
  amount_twd: string;
  currency: DisplayCurrency;
  billing_cycle: PersonalBillingCycle;
  next_billing_on: string;
  reminder_days: string;
  category: string;
  categoryCustom: string;
  usage: UsageLevel | "";
  priceWatch: boolean;
  notes: string;
};

const emptyForm: FormState = {
  name: "",
  amount_twd: "",
  currency: "TWD",
  billing_cycle: "monthly",
  next_billing_on: "",
  reminder_days: "3",
  category: "",
  categoryCustom: "",
  usage: "",
  priceWatch: false,
  notes: "",
};

function resolveCategory(form: FormState): string | null {
  if (form.category === "__custom__") {
    return form.categoryCustom.trim() || null;
  }
  return form.category.trim() || null;
}

function formFromItem(item: PersonalSubscription): FormState {
  const meta = parseNotesMeta(item.notes);
  const cat = item.category || "";
  const isPreset = (CATEGORY_PRESETS as readonly string[]).includes(cat);
  return {
    name: item.name,
    amount_twd: String(item.amount_twd),
    currency: meta.currency,
    billing_cycle: item.billing_cycle,
    next_billing_on: item.next_billing_on || "",
    reminder_days: String(item.reminder_days ?? 3),
    category: isPreset ? cat : cat ? "__custom__" : "",
    categoryCustom: isPreset ? "" : cat,
    usage: meta.usage || "",
    priceWatch: meta.priceWatch,
    notes: meta.freeText,
  };
}

export function AppShell() {
  const [items, setItems] = useState<PersonalSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>("TWD");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setHint(json.error || "無法載入");
        setItems([]);
        return;
      }
      setHint(null);
      setItems(json.items || []);
    } catch {
      setHint("無法載入訂閱清單");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    void fetch("/api/session", { method: "POST" }).catch(() => null);
  }, [load]);

  const activeItems = useMemo(
    () => items.filter((i) => i.is_active),
    [items],
  );

  const monthlyTotalTwd = useMemo(
    () =>
      activeItems.reduce(
        (sum, i) => sum + monthlyEquivalent(i.amount_twd, i.billing_cycle),
        0,
      ),
    [activeItems],
  );

  const yearlyTotalTwd = useMemo(
    () =>
      activeItems.reduce(
        (sum, i) => sum + yearlyEquivalent(i.amount_twd, i.billing_cycle),
        0,
      ),
    [activeItems],
  );

  const dueSoon = useMemo(
    () => items.filter((i) => isDueSoon(i)),
    [items],
  );

  const priceWatchItems = useMemo(
    () =>
      activeItems.filter((i) => {
        const meta = parseNotesMeta(i.notes);
        return meta.priceWatch || /漲價/.test(i.notes || "");
      }),
    [activeItems],
  );

  const lowUsageItems = useMemo(
    () =>
      activeItems.filter((i) => {
        const meta = parseNotesMeta(i.notes);
        return isLowUsage(i.notes, meta.usage);
      }),
    [activeItems],
  );

  const categorySpend = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of activeItems) {
      const key = i.category?.trim() || "未分類";
      map.set(
        key,
        (map.get(key) || 0) + monthlyEquivalent(i.amount_twd, i.billing_cycle),
      );
    }
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [activeItems]);

  const categoryMax = categorySpend[0]?.amount || 1;

  const topYearlyCategories = useMemo(
    () =>
      categorySpend.slice(0, 5).map((c) => ({
        ...c,
        yearly: c.amount * 12,
      })),
    [categorySpend],
  );

  function exportJson() {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadBlob(
      `訂閱管家-export-${stamp}.json`,
      JSON.stringify({ exported_at: new Date().toISOString(), items }, null, 2),
      "application/json",
    );
    toast.success("已下載 JSON");
  }

  function exportCsv() {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadBlob(
      `訂閱管家-export-${stamp}.csv`,
      subscriptionsToCsv(items),
      "text/csv;charset=utf-8",
    );
    toast.success("已下載 CSV");
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(form.amount_twd);
    if (!form.name.trim() || !Number.isFinite(amount) || amount < 0) {
      toast.error("請填寫名稱與有效金額");
      return;
    }
    const notes = buildNotes({
      currency: form.currency,
      usage: form.usage || null,
      priceWatch: form.priceWatch,
      freeText: form.notes,
    });
    const payload = {
      name: form.name.trim(),
      amount_twd: Math.round(amount),
      billing_cycle: form.billing_cycle,
      next_billing_on: form.next_billing_on || null,
      reminder_days: Number(form.reminder_days) || 3,
      category: resolveCategory(form),
      notes,
    };
    setSaving(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId ? { id: editingId, ...payload } : payload,
        ),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || (editingId ? "更新失敗" : "新增失敗"));
      toast.success(editingId ? "已更新訂閱" : "已新增訂閱（雲端已儲存）");
      resetForm();
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("確定刪除此訂閱紀錄？")) return;
    const res = await fetch(`/api/subscriptions?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(json.error || "刪除失敗");
      return;
    }
    toast.success("已刪除");
    if (editingId === id) resetForm();
    await load();
  }

  async function toggleActive(item: PersonalSubscription) {
    const res = await fetch("/api/subscriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, is_active: !item.is_active }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error || "更新失敗");
      return;
    }
    await load();
  }

  const showConverted = displayCurrency !== "TWD";

  return (
    <div className="min-h-dvh bg-[#070a0f] text-slate-100">
      <AppHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-20">
        <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-teal-400/10 via-transparent to-sky-500/5 p-5">
          <p className="text-sm text-slate-400">個人訂閱開銷與扣款提醒</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">我的雲端訂閱</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            已登入拓新雲端 NovaOS 帳號。訂閱資料<strong className="font-medium text-slate-200">雲端保存</strong>
            ，換裝置或重新登入後仍可讀取；每位會員僅能看到自己的清單。
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-6">
            <div>
              <p className="text-xs text-slate-500">每月合計（TWD）</p>
              <p className="text-3xl font-bold text-teal-300">
                {formatMoney(monthlyTotalTwd, "TWD")}
                <span className="ml-2 text-base font-medium text-slate-500">
                  ／月
                </span>
              </p>
              {showConverted ? (
                <p className="mt-1 text-sm text-slate-400">
                  ≈ {formatMoney(twdToDisplay(monthlyTotalTwd, displayCurrency), displayCurrency)}
                  <span className="text-slate-600">（參考匯率）</span>
                </p>
              ) : null}
            </div>
            <div>
              <p className="text-xs text-slate-500">年度推估（月費×12）</p>
              <p className="text-2xl font-bold text-sky-300">
                {formatMoney(yearlyTotalTwd, "TWD")}
                <span className="ml-2 text-sm font-medium text-slate-500">
                  ／年
                </span>
              </p>
              {showConverted ? (
                <p className="mt-1 text-sm text-slate-400">
                  ≈ {formatMoney(twdToDisplay(yearlyTotalTwd, displayCurrency), displayCurrency)}
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-400">
              顯示幣別
              <select
                className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm text-white"
                value={displayCurrency}
                onChange={(e) =>
                  setDisplayCurrency(e.target.value as DisplayCurrency)
                }
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <span className="text-[11px] text-slate-600">
              金額以 TWD 為準；USD／JPY 僅供參考換算
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportJson}
              disabled={items.length === 0}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-200 hover:bg-white/10 disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              Export JSON
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={items.length === 0}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-200 hover:bg-white/10 disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => setPrivacyOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-200 hover:bg-white/10"
            >
              <Shield className="h-3.5 w-3.5" />
              隱私／資料
            </button>
          </div>
        </section>

        {dueSoon.length > 0 ? (
          <section className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-100">
              <AlertTriangle className="h-4 w-4" />
              訂閱到期提醒（{dueSoon.length}）
            </h2>
            <ul className="mt-2 space-y-1.5">
              {dueSoon.map((i) => {
                const d = daysUntil(i.next_billing_on);
                return (
                  <li key={i.id} className="text-sm text-amber-50/90">
                    {i.name}
                    {d !== null
                      ? d === 0
                        ? " · 今天扣款"
                        : ` · ${d} 天後扣款`
                      : ""}
                    {i.next_billing_on ? `（${i.next_billing_on}）` : ""}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {priceWatchItems.length > 0 ? (
          <section className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            <strong className="font-semibold">漲價提醒：</strong>
            {priceWatchItems.map((i) => i.name).join("、")}
            — 備註含「漲價」或已標記關注漲價，建議核對最新方案。
          </section>
        ) : null}

        {lowUsageItems.length > 0 ? (
          <section className="rounded-2xl border border-violet-400/25 bg-violet-400/10 px-4 py-3 text-sm text-violet-100">
            <strong className="font-semibold">不常使用提醒：</strong>
            {lowUsageItems.map((i) => i.name).join("、")}
            — 標記為很少用／備註含不常用，可考慮取消以節省開銷。
          </section>
        ) : null}

        {activeItems.length > 0 ? (
          <section className="space-y-4 rounded-2xl border border-white/10 bg-[#10151d] p-5">
            <div>
              <h2 className="text-lg font-semibold">每月訂閱支出圖表</h2>
              <p className="mt-1 text-sm text-slate-500">依分類加總月費等值</p>
            </div>
            <ul className="space-y-3">
              {categorySpend.map((row) => (
                <li key={row.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-300">{row.name}</span>
                    <span className="text-teal-300">
                      {formatMoney(row.amount, "TWD")}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 transition-all duration-500"
                      style={{
                        width: `${Math.max(4, (row.amount / categoryMax) * 100)}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-white/10 pt-4">
              <h3 className="text-base font-semibold">年度支出分析</h3>
              <p className="mt-1 text-sm text-slate-400">
                年度推估合計{" "}
                <span className="font-semibold text-sky-300">
                  {formatMoney(yearlyTotalTwd, "TWD")}
                </span>
                （由各訂閱月費等值 × 12）
              </p>
              {topYearlyCategories.length > 0 ? (
                <ul className="mt-3 space-y-1.5">
                  {topYearlyCategories.map((c, idx) => (
                    <li
                      key={c.name}
                      className="flex justify-between text-sm text-slate-300"
                    >
                      <span>
                        {idx + 1}. {c.name}
                      </span>
                      <span className="text-sky-300/90">
                        {formatMoney(c.yearly, "TWD")}／年
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ) : null}

        <LegacyMigrate onImported={() => void load()} />

        {hint ? (
          <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {hint}
          </p>
        ) : null}

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-white/10 bg-[#10151d] p-5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {editingId ? (
                <Pencil className="h-4 w-4 text-teal-300" />
              ) : (
                <Plus className="h-4 w-4 text-teal-300" />
              )}
              <h2 className="text-lg font-semibold">
                {editingId ? "編輯訂閱" : "新增訂閱"}
              </h2>
            </div>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                取消編輯
              </button>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs text-slate-400">名稱</span>
              <input
                required
                className="field"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="例如 Netflix、Adobe"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-slate-400">金額</span>
              <input
                required
                type="number"
                min={0}
                className="field"
                value={form.amount_twd}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount_twd: e.target.value }))
                }
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-slate-400">幣別標籤（預設 TWD）</span>
              <select
                className="field"
                value={form.currency}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    currency: e.target.value as DisplayCurrency,
                  }))
                }
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <span className="block text-[11px] text-slate-600">
                資料庫以 TWD 欄位儲存；非 TWD 僅作顯示標籤
              </span>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-slate-400">週期</span>
              <select
                className="field"
                value={form.billing_cycle}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    billing_cycle: e.target.value as PersonalBillingCycle,
                  }))
                }
              >
                {CYCLES.map((c) => (
                  <option key={c} value={c}>
                    {CYCLE_LABELS[c]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-slate-400">下次扣款日</span>
              <input
                type="date"
                className="field"
                value={form.next_billing_on}
                onChange={(e) =>
                  setForm((f) => ({ ...f, next_billing_on: e.target.value }))
                }
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-slate-400">提前提醒（天）</span>
              <input
                type="number"
                min={0}
                max={30}
                className="field"
                value={form.reminder_days}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reminder_days: e.target.value }))
                }
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-slate-400">訂閱服務分類</span>
              <select
                className="field"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
              >
                <option value="">未分類</option>
                {CATEGORY_PRESETS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__custom__">自訂…</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-slate-400">使用頻率</span>
              <select
                className="field"
                value={form.usage}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    usage: e.target.value as UsageLevel | "",
                  }))
                }
              >
                <option value="">未設定</option>
                {USAGE_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
            {form.category === "__custom__" ? (
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-xs text-slate-400">自訂分類</span>
                <input
                  className="field"
                  value={form.categoryCustom}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, categoryCustom: e.target.value }))
                  }
                  placeholder="輸入分類名稱"
                />
              </label>
            ) : null}
            <label className="flex items-center gap-2 sm:col-span-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.priceWatch}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priceWatch: e.target.checked }))
                }
                className="h-4 w-4 rounded border-white/20 bg-black/40"
              />
              關注漲價（或於備註寫入「漲價」）
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs text-slate-400">備註</span>
              <input
                className="field"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="可寫漲價、很少用等提示"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 px-4 font-semibold text-[#041016] disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : editingId ? (
              <Pencil className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {editingId ? "儲存變更到雲端" : "新增到我的雲端清單"}
          </button>
        </form>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">我的訂閱</h2>
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> 載入中…
            </p>
          ) : items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-500">
              尚無訂閱紀錄。新增後會雲端保存於你的拓新雲端帳號，換裝置登入仍可讀取。
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => {
                const meta = parseNotesMeta(item.notes);
                const due = isDueSoon(item);
                const cancel = cancelHelpFor(item.name);
                const monthly = monthlyEquivalent(
                  item.amount_twd,
                  item.billing_cycle,
                );
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "rounded-2xl border p-4 transition-colors",
                      due
                        ? "border-amber-400/40 bg-amber-400/5"
                        : "border-white/10 bg-[#10151d]",
                      !item.is_active && "opacity-60",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-semibold text-white">
                          {item.name}
                          {due ? (
                            <span className="ml-2 text-xs font-medium text-amber-300">
                              即將扣款
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {formatMoney(item.amount_twd, meta.currency)} ·{" "}
                          {CYCLE_LABELS[item.billing_cycle]}
                          <span className="text-slate-600">
                            {" "}
                            （月費等值 {formatMoney(monthly, "TWD")}）
                          </span>
                          {item.next_billing_on
                            ? ` · 下次 ${item.next_billing_on}`
                            : ""}
                          {item.category ? ` · ${item.category}` : ""}
                          {meta.usage ? ` · ${meta.usage}` : ""}
                        </p>
                        {meta.freeText ? (
                          <p className="mt-1 text-xs text-slate-500">
                            {meta.freeText}
                          </p>
                        ) : null}
                        <a
                          href={cancel.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-teal-300/90 hover:text-teal-200"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {cancel.label}
                        </a>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(item.id);
                            setForm(formFromItem(item));
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="rounded-xl border border-white/10 px-3 py-1.5 text-sm text-slate-200"
                          title="編輯"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActive(item)}
                          className="rounded-xl border border-white/10 px-3 py-1.5 text-sm text-slate-200"
                        >
                          {item.is_active ? "暫停" : "啟用"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item.id)}
                          className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-1.5 text-rose-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      {privacyOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-title"
          onClick={() => setPrivacyOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#10151d] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-3 top-3 rounded-lg p-1 text-slate-500 hover:bg-white/5 hover:text-slate-300"
              onClick={() => setPrivacyOpen(false)}
              aria-label="關閉"
            >
              <X className="h-4 w-4" />
            </button>
            <h2
              id="privacy-title"
              className="pr-8 text-lg font-semibold text-white"
            >
              隱私與資料政策
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-400">
              <p>
                訂閱管家的雲端訂閱列與你的 NovaOS 帳號綁定，並依使用者隔離。換裝置或重新登入後，登入同一帳號即可讀取。
              </p>
              <p>
                <strong className="font-medium text-slate-200">刪除帳號：</strong>
                若你刪除 NovaOS 帳號，雲端訂閱列會一併移除（資料庫對使用者採串聯刪除）。建議先使用「Export JSON／CSV」備份。
              </p>
              <p>
                帳號、服務條款、隱私與退款說明請至 NovaOS 主站；客服統一走官方 LINE。
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href={`${SUBKEEPER.hubUrl}/dashboard/pass`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-teal-300 hover:text-teal-200"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  統一會員中心
                </a>
                <a
                  href={`${SUBKEEPER.hubUrl}/terms`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-300/90 hover:text-teal-200"
                >
                  服務條款
                </a>
                <a
                  href={`${SUBKEEPER.hubUrl}/privacy`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-300/90 hover:text-teal-200"
                >
                  隱私政策
                </a>
                <a
                  href={`${SUBKEEPER.hubUrl}/refund`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-300/90 hover:text-teal-200"
                >
                  退款說明
                </a>
                <a
                  href="https://line.me/R/ti/p/@469uykad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-300/90 hover:text-teal-200"
                >
                  LINE 客服 @469uykad
                </a>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportJson}
                disabled={items.length === 0}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-teal-400/20 px-3 text-sm text-teal-200 disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" />
                先匯出 JSON
              </button>
              <button
                type="button"
                onClick={() => setPrivacyOpen(false)}
                className="inline-flex h-9 items-center rounded-xl border border-white/10 px-3 text-sm text-slate-300"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
