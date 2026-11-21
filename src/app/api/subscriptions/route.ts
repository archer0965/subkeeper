import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const cycleSchema = z.enum(["monthly", "yearly", "weekly", "custom"]);

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  amount_twd: z.number().int().min(0).max(10_000_000),
  billing_cycle: cycleSchema.default("monthly"),
  next_billing_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  reminder_days: z.number().int().min(0).max(30).default(3),
  category: z.string().trim().max(40).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  is_active: z.boolean().optional(),
});

const updateSchema = createSchema.partial().extend({
  id: z.string().uuid(),
});

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入拓新雲端" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("personal_subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("next_billing_on", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[subscriptions GET]", error);
    const missing =
      error.message?.includes("personal_subscriptions") || error.code === "42P01";
    return NextResponse.json(
      {
        error: missing
          ? "訂閱管家資料表尚未建立，請於 Supabase 執行 migration 028／029"
          : "無法讀取訂閱清單",
      },
      { status: missing ? 503 : 500 },
    );
  }

  return NextResponse.json({ items: data || [] });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入拓新雲端" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "資料無效" },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const { data, error } = await supabase
    .from("personal_subscriptions")
    .insert({
      user_id: user.id,
      name: body.name,
      amount_twd: body.amount_twd,
      billing_cycle: body.billing_cycle,
      next_billing_on: body.next_billing_on ?? null,
      reminder_days: body.reminder_days,
      category: body.category ?? null,
      notes: body.notes ?? null,
      is_active: body.is_active ?? true,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    console.error("[subscriptions POST]", error);
    return NextResponse.json({ error: "無法新增訂閱" }, { status: 500 });
  }
  return NextResponse.json({ item: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入拓新雲端" }, { status: 401 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "資料無效" },
      { status: 400 },
    );
  }

  const { id, ...rest } = parsed.data;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(rest)) {
    if (v !== undefined) patch[k] = v;
  }

  const { data, error } = await supabase
    .from("personal_subscriptions")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("[subscriptions PATCH]", error);
    return NextResponse.json({ error: "無法更新訂閱" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "找不到此訂閱" }, { status: 404 });
  }
  return NextResponse.json({ item: data });
}

export async function DELETE(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入拓新雲端" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "缺少訂閱 id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("personal_subscriptions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[subscriptions DELETE]", error);
    return NextResponse.json({ error: "無法刪除訂閱" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
