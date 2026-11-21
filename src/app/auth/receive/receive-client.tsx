"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sanitizeNextPath } from "@/lib/safe-next";
import { HUB_URL } from "@/lib/subkeeper";

export function AuthReceiveClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("正在完成登入…");

  useEffect(() => {
    const next = sanitizeNextPath(searchParams.get("next") || "/app");
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        await fetch("/api/session", { method: "POST" }).catch(() => null);
        router.replace(next);
        router.refresh();
        return;
      }
      setMessage("登入狀態未帶入，改導向拓新雲端…");
      const returnTo = `${window.location.origin}/auth/receive?next=${encodeURIComponent(next)}`;
      window.location.replace(
        `${HUB_URL.replace(/\/$/, "")}/login?next=${encodeURIComponent(returnTo)}`
      );
    })().catch(() => setMessage("登入失敗，請重新嘗試"));

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070a0f] px-4 text-slate-300">
      <p className="text-sm">{message}</p>
    </main>
  );
}
