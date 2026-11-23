import Link from "next/link";
import { LandingDemo } from "@/components/LandingDemo";
import { hubAuthRedirect } from "@/lib/hub-auth";
import { SUBKEEPER } from "@/lib/subkeeper";

/** Landing gate — product intro + privacy-safe Demo; auth via NovaOS hub. */
export function AuthGate() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col justify-center px-4 py-16">
      <p className="text-xs font-semibold tracking-wide text-teal-300/90">
        拓新雲端 NovaOS
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
        {SUBKEEPER.name}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        智慧訂閱管理 × 雲端助手：把影音、軟體、雲端等訂閱集中一處，自動換算每月／每年開銷，並在扣款日前提醒你。永久免費；使用 NovaOS
        帳號登入後，資料雲端保存、換裝置也能讀取。
      </p>
      <ul className="mt-4 space-y-1.5 text-sm text-slate-400">
        <li className="flex gap-2">
          <span className="text-teal-400" aria-hidden>
            ·
          </span>
          月費／年費等值合計與分類支出一覽
        </li>
        <li className="flex gap-2">
          <span className="text-teal-400" aria-hidden>
            ·
          </span>
          扣款日前提醒、漲價與不常使用提示
        </li>
        <li className="flex gap-2">
          <span className="text-teal-400" aria-hidden>
            ·
          </span>
          匯出 JSON／CSV，雲端資料依帳號隔離
        </li>
      </ul>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-300 px-5 text-sm font-semibold text-[#041016]"
          href={hubAuthRedirect("login", "/app")}
        >
          使用拓新雲端帳號登入
        </Link>
        <Link
          className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 px-5 text-sm font-medium text-slate-200 hover:bg-white/5"
          href={hubAuthRedirect("signup", "/app")}
        >
          註冊帳號
        </Link>
        <a
          className="inline-flex h-11 items-center justify-center rounded-xl border border-teal-400/30 px-5 text-sm font-medium text-teal-200 hover:bg-teal-400/10"
          href="#demo"
        >
          先看互動 Demo
        </a>
      </div>
      <p className="mt-6 text-xs text-slate-500">
        登入頁統一在{" "}
        <a className="underline hover:text-slate-300" href={SUBKEEPER.hubUrl}>
          paycheck.com.de
        </a>
        ；完成後會經{" "}
        <code className="rounded bg-white/5 px-1 py-0.5 text-[11px] text-slate-400">
          /auth/receive
        </code>{" "}
        自動回到{SUBKEEPER.name}。
      </p>

      <LandingDemo />
    </div>
  );
}
