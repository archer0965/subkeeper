import Link from "next/link";
import { hubAuthRedirect } from "@/lib/hub-auth";
import { SUBKEEPER } from "@/lib/subkeeper";

/** Landing gate — login required; auth always via NovaOS hub. */
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
        訂閱管家需登入 NovaOS 帳號：清單綁定你的身分，與 NovaStore
        等產品共用同一組登入。未登入無法讀寫資料。
      </p>
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
      </div>
      <p className="mt-6 text-xs text-slate-500">
        登入頁統一在{" "}
        <a className="underline hover:text-slate-300" href={SUBKEEPER.hubUrl}>
          paycheck.com.de
        </a>
        ；完成後會自動回到訂閱管家。
      </p>
    </div>
  );
}
