"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  clearLegacyLocalSubscriptions,
  readLegacyLocalSubscriptions,
  type LegacySubkeeperItem,
} from "@/lib/subkeeper";

export function LegacyMigrate({ onImported }: { onImported?: () => void }) {
  const [items, setItems] = useState<LegacySubkeeperItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setItems(readLegacyLocalSubscriptions());
  }, []);

  if (dismissed || !items || items.length === 0) return null;

  async function syncNow() {
    if (!items?.length) return;
    setBusy(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "同步失敗");
      clearLegacyLocalSubscriptions();
      toast.success(
        `已同步 ${json.imported ?? items.length} 筆本機訂閱至拓新雲端帳號`,
      );
      setDismissed(true);
      onImported?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "同步失敗");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
      <p className="text-base font-semibold text-amber-100">檢測到本機舊資料</p>
      <p className="mt-1 text-sm text-amber-100/80">
        找到 {items.length}{" "}
        筆舊版訂閱管家（免登入）紀錄。是否一鍵同步至拓新雲端 NovaOS
        帳號？同步成功後將清除本機快取。
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={syncNow}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          一鍵同步至 NovaOS 帳號
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setDismissed(true)}
          className="h-10 rounded-xl border border-white/10 px-4 text-sm text-slate-300"
        >
          稍後再說
        </button>
      </div>
    </div>
  );
}
