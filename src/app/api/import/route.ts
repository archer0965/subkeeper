import { NextResponse } from "next/server";
import { z } from "zod";
import {
  nextBillingFromDay,
  normalizeLegacyCycle,
} from "@/lib/subkeeper";
import { createClient } from "@/lib/supabase/server";

const itemSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().trim().min(1).max(80),
  amount: z.number().min(0).max(10_000_000),
  cycle: z.string().optional(),
  billingDay: z.number().int().min(1).max(31).optional(),
  status: z.string().optional(),
  accent: z.string().max(40).optional(),
});

const bodySchema = z.object({
  items: z.array(itemSchema).min(1).max(200),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入拓新雲端" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "匯入資料無效" },
      { status: 400 },
    );
  }

  const rows = parsed.data.items.map((item) => {
    const cycle = normalizeLegacyCycle(item.cycle);
    const notesParts = [
      item.accent ? `accent:${item.accent}` : null,
      "imported:subkeeper-subscriptions-v1",
    ].filter(Boolean);
    return {
      user_id: user.id,
      name: item.name,
      amount_twd: Math.round(item.amount),
      billing_cycle: cycle,
      next_billing_on: item.billingDay
        ? nextBillingFromDay(item.billingDay)
        : null,
      reminder_days: 3,
      category: "本機匯入",
      notes: notesParts.join(" · "),
      is_active: (item.status || "active").toLowerCase() !== "paused",
      legacy_client_id: item.id,
      updated_at: new Date().toISOString(),
    };
  });

  const { data, error } = await supabase
    .from("personal_subscriptions")
    .upsert(rows, {
      onConflict: "user_id,legacy_client_id",
      ignoreDuplicates: false,
    })
    .select("id, legacy_client_id");

  if (error) {
    console.error("[import]", error);
    let imported = 0;
    for (const row of rows) {
      const { legacy_client_id, ...rest } = row;
      const { error: insErr } = await supabase
        .from("personal_subscriptions")
        .insert({
          ...rest,
          notes: `${rest.notes} · legacy:${legacy_client_id}`,
        });
      if (!insErr) imported += 1;
    }
    return NextResponse.json({
      ok: true,
      imported,
      mode: "fallback-insert",
      warning: "建議套用 NovaOS migration 029 以啟用 legacy 去重索引",
    });
  }

  return NextResponse.json({
    ok: true,
    imported: data?.length ?? rows.length,
    mode: "upsert",
  });
}
