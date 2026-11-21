import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Touch / create NovaOS profile + last_login_at (user-scoped, no service role). */
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入拓新雲端" }, { status: 401 });
  }

  const now = new Date().toISOString();
  const meta = user.user_metadata || {};
  const shopName =
    (typeof meta.shop_name === "string" && meta.shop_name.trim()) ||
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    "";

  const { data: existing } = await supabase
    .from("profiles")
    .select("id, shop_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      shop_name: shopName,
      last_login_at: now,
    });
    if (error) {
      // Trigger may already create profile on signup — fall through to update.
      console.error("[session insert]", error);
    }
  }

  const patch: Record<string, unknown> = { last_login_at: now };
  if (shopName) patch.shop_name = shopName;
  const { error: updErr } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id);
  if (updErr) console.error("[session update]", updErr);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, shop_name, last_login_at, created_at")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, last_sign_in_at: user.last_sign_in_at },
    profile,
  });
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, shop_name, last_login_at, created_at")
    .eq("id", user.id)
    .maybeSingle();
  return NextResponse.json({
    authenticated: true,
    user: { id: user.id, email: user.email, last_sign_in_at: user.last_sign_in_at },
    profile,
  });
}
