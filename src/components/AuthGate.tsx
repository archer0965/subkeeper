import Link from "next/link";
import { SUBKEEPER } from "@/lib/subkeeper";

export function AuthGate() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#070a0f] text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="absolute -right-16 bottom-20 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <header className="mx-auto flex w-full max-w-lg items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-sky-500 text-sm font-bold text-[#041016]">
            訂
          </span>
          <span className="font-semibold text-white">{SUBKEEPER.name}</span>
        </div>
        <a
          href={SUBKEEPER.hubUrl}
          className="text-sm text-slate-400 hover:text-white"
        >
          返回拓新雲端
        </a>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 pb-16">
        <p className="text-sm font-semibold tracking-wide text-teal-300/90">
          拓新雲端 NovaOS
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
          使用 拓新雲端 NovaOS 帳號登入
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          訂閱管家已升級為雲端帳號制：訂閱清單綁定你的 NovaOS
          身分，與 NovaStore、Nova AI Doc
          等產品共用同一組登入。未登入訪客無法讀寫資料。
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={SUBKEEPER.loginHref}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 text-base font-semibold text-[#041016]"
          >
            使用 拓新雲端 NovaOS 帳號登入
          </Link>
          <Link
            href={SUBKEEPER.signupHref}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm text-slate-200"
          >
            還沒有帳號？免費註冊
          </Link>
          <a
            href={`${SUBKEEPER.hubUrl}/login?next=${encodeURIComponent("/dashboard/subkeeper")}`}
            className="text-center text-xs text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
          >
            或前往 NovaOS 主站統一登入
          </a>
        </div>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            產品矩陣
          </p>
          <ul className="mt-3 grid gap-1 sm:grid-cols-2">
            {SUBKEEPER.matrixProducts.map((p) => (
              <li key={p.href}>
                <a
                  href={p.href}
                  className="block rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {p.name}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
