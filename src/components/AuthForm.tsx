"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { sanitizeNextPath } from "@/lib/safe-next";
import { SUBKEEPER } from "@/lib/subkeeper";

export function AuthForm({
  mode,
  nextPath = "/app",
}: {
  mode: "login" | "signup";
  nextPath?: string;
}) {
  const router = useRouter();
  const safeNext = sanitizeNextPath(nextPath);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { shop_name: displayName || email.split("@")[0] },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`,
          },
        });
        if (error) throw error;
        if (data.session) {
          await fetch("/api/session", { method: "POST" }).catch(() => null);
          toast.success("註冊成功");
          router.push(safeNext);
          router.refresh();
        } else {
          toast.success("請至信箱完成驗證後再登入");
          router.push(`/login?next=${encodeURIComponent(safeNext)}`);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        await fetch("/api/session", { method: "POST" }).catch(() => null);
        toast.success("登入成功");
        router.push(safeNext);
        router.refresh();
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : "操作失敗";
      const map: Record<string, string> = {
        "Invalid login credentials": "Email 或密碼錯誤",
        "Email not confirmed": "Email 尚未驗證，請先至信箱點擊驗證連結",
        "User already registered": "此 Email 已註冊，請直接登入",
        "Password should be at least 6 characters": "密碼至少需要 6 碼",
      };
      toast.error(map[raw] || raw);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#070a0f] px-4 py-10 text-slate-100">
      <div className="mx-auto w-full max-w-md flex-1">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold text-teal-300">拓新雲端 NovaOS</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            {mode === "login" ? "登入訂閱管家" : "建立 NovaOS 帳號"}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            與 NovaStore、Nova AI Doc 等產品共用同一組帳號
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-3xl border border-white/10 bg-[#10151d] p-6"
        >
          {mode === "signup" ? (
            <label className="block space-y-1.5">
              <span className="text-xs text-slate-400">顯示名稱</span>
              <input
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-white outline-none focus:border-teal-400/50"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="你的暱稱"
              />
            </label>
          ) : null}
          <label className="block space-y-1.5">
            <span className="text-xs text-slate-400">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-white outline-none focus:border-teal-400/50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-slate-400">密碼</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-white outline-none focus:border-teal-400/50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 font-semibold text-[#041016] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === "login" ? "登入" : "註冊"}
          </button>
          <p className="text-center text-sm text-slate-500">
            {mode === "login" ? (
              <>
                還沒有帳號？{" "}
                <Link
                  href={`/signup?next=${encodeURIComponent(safeNext)}`}
                  className="text-teal-300"
                >
                  免費註冊
                </Link>
              </>
            ) : (
              <>
                已有帳號？{" "}
                <Link
                  href={`/login?next=${encodeURIComponent(safeNext)}`}
                  className="text-teal-300"
                >
                  登入
                </Link>
              </>
            )}
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-slate-600">
          <a href={SUBKEEPER.hubUrl} className="hover:text-slate-400">
            返回 NovaOS 主站
          </a>
        </p>
      </div>
    </div>
  );
}
