"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Grid3X3, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SUBKEEPER } from "@/lib/subkeeper";

type Account = {
  email: string;
  name: string;
  avatarUrl: string | null;
};

export function AppHeader() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [matrixOpen, setMatrixOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const meta = user.user_metadata || {};
      let name =
        (typeof meta.shop_name === "string" && meta.shop_name) ||
        (typeof meta.full_name === "string" && meta.full_name) ||
        (typeof meta.name === "string" && meta.name) ||
        user.email?.split("@")[0] ||
        "NovaOS 用戶";
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("shop_name")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.shop_name) name = profile.shop_name;
      } catch {
        /* ignore */
      }
      if (!cancelled) {
        setAccount({
          email: user.email || "",
          name,
          avatarUrl:
            (typeof meta.avatar_url === "string" && meta.avatar_url) ||
            (typeof meta.picture === "string" && meta.picture) ||
            null,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initials = (account?.name || account?.email || "?").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070a0f]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-sky-500 text-sm font-bold text-[#041016]">
            訂
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-white">
              {SUBKEEPER.name}
            </p>
            <p className="truncate text-[11px] text-slate-500">
              拓新雲端 NovaOS · 統一登入
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setMatrixOpen((v) => !v);
                setMenuOpen(false);
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              aria-label="產品矩陣"
              title="返回 NovaOS 主站矩陣"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            {matrixOpen ? (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-white/10 bg-[#10151d] p-2 shadow-xl">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  拓新雲端產品矩陣
                </p>
                {SUBKEEPER.matrixProducts.map((p) => (
                  <a
                    key={p.href}
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
                    onClick={() => setMatrixOpen(false)}
                  >
                    {p.name}
                  </a>
                ))}
                <Link
                  href={SUBKEEPER.hubUrl}
                  className="mt-1 block rounded-xl px-3 py-2 text-sm font-medium text-teal-300 hover:bg-white/5"
                  onClick={() => setMatrixOpen(false)}
                >
                  返回 NovaOS 主站
                </Link>
              </div>
            ) : null}
          </div>

          {account ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen((v) => !v);
                  setMatrixOpen(false);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 py-1 pl-1 pr-2.5"
                aria-label="拓新雲端 NovaOS 帳號"
              >
                {account.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={account.avatarUrl}
                    alt=""
                    className="h-8 w-8 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-400/20 text-xs font-semibold text-teal-200">
                    {initials}
                  </span>
                )}
                <span className="hidden max-w-[8rem] sm:block">
                  <span className="block truncate text-xs font-medium text-white">
                    {account.name}
                  </span>
                  <span className="block truncate text-[10px] text-slate-500">
                    拓新雲端 NovaOS 帳號
                  </span>
                </span>
              </button>
              {menuOpen ? (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-[#10151d] p-2 shadow-xl">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-white">{account.name}</p>
                    <p className="truncate text-xs text-slate-500">{account.email}</p>
                  </div>
                  <a
                    href={SUBKEEPER.hubUrl}
                    className="block rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
                  >
                    返回 NovaOS 主站
                  </a>
                  <a
                    href={`${SUBKEEPER.hubUrl}/dashboard`}
                    className="block rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
                  >
                    產品矩陣／總控台
                  </a>
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-300 hover:bg-white/5"
                  >
                    <LogOut className="h-4 w-4" />
                    登出
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
