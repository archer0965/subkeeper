"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { LegacyMigrate } from "@/components/LegacyMigrate";
import {
  CYCLE_LABELS,
  cn,
  monthlyEquivalent,
  type PersonalBillingCycle,
  type PersonalSubscription,
} from "@/lib/subkeeper";

const CYCLES: PersonalBillingCycle[] = [
  "monthly",
  "yearly",
  "weekly",
  "custom",
];

type FormState = {
  name: string;
  amount_twd: string;
  billing_cycle: PersonalBillingCycle;
  next_billing_on: string;
  reminder_days: string;
  category: string;
  notes: string;
};

const emptyForm: FormState = {
  name: "",
  amount_twd: "",
  billing_cycle: "monthly",
  next_billing_on: "",
  reminder_days: "3",
  category: "",
  notes: "",
};

export function AppShell() {
  const [items, setItems] = useState<PersonalSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [hint, setHint] = useState<string | null>(null);

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

  const monthlyTotal = useMemo(
    () =>
      items
        .filter((i) => i.is_active)
        .reduce(
          (sum, i) => sum + monthlyEquivalent(i.amount_twd, i.billing_cycle),
          0,
        ),
    [items],
  );

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(form.amount_twd);
    if (!form.name.trim() || !Number.isFinite(amount) || amount < 0) {
      toast.error("請填寫名稱與有效金額");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          amount_twd: Math.round(amount),
          billing_cycle: form.billing_cycle,
          next_billing_on: form.next_billing_on || null,
          reminder_days: Number(form.reminder_days) || 3,
          category: form.category.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "新增失敗");
      toast.success("已新增訂閱");
      setForm(emptyForm);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "新增失敗");
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

  return (
    <div className="min-h-dvh bg-[#070a0f] text-slate-100">
      <AppHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-20">
        <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-teal-400/10 via-transparent to-sky-500/5 p-5">
          <p className="text-sm text-slate-400">個人訂閱開銷與扣款提醒</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">我的雲端訂閱</h1>
          <p className="mt-2 text-sm text-slate-400">
            已登入拓新雲端 NovaOS 帳號；資料依使用者隔離保存在雲端。
          </p>
          <p className="mt-4 text-3xl font-bold text-teal-300">
            約 NT${monthlyTotal.toLocaleString("zh-TW")}
            <span className="ml-2 text-base font-medium text-slate-500">
              ／月（有效訂閱）
            </span>
          </p>
        </section>

        <LegacyMigrate onImported={() => void load()} />

        {hint ? (
          <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {hint}
          </p>
        ) : null}

        <form
          onSubmit={onCreate}
          className="space-y-4 rounded-2xl border border-white/10 bg-[#10151d] p-5"
        >
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-teal-300" />
            <h2 className="text-lg font-semibold">新增訂閱</h2>
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
              <span className="text-xs text-slate-400">金額（TWD）</span>
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
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs text-slate-400">分類（選填）</span>
              <input
                className="field"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                placeholder="影音／軟體／雲端…"
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs text-slate-400">備註</span>
              <input
                className="field"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 px-4 font-semibold text-[#041016] disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            新增到我的雲端清單
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
              尚無訂閱紀錄。新增後會保存在你的拓新雲端帳號。
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    "rounded-2xl border border-white/10 bg-[#10151d] p-4",
                    !item.is_active && "opacity-60",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {item.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        NT${item.amount_twd.toLocaleString("zh-TW")} ·{" "}
                        {CYCLE_LABELS[item.billing_cycle]}
                        {item.next_billing_on
                          ? ` · 下次 ${item.next_billing_on}`
                          : ""}
                        {item.category ? ` · ${item.category}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
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
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
