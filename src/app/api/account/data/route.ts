import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Wipe this member's 訂閱管家 cloud rows only (not the NovaOS Auth account).
 * Always scoped by auth user.id — never deletes another member's data.
 */
export async function DELETE() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入拓新雲端" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("personal_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    console.error("[account/data DELETE]", error);
    return NextResponse.json(
      { error: "無法清除雲端訂閱資料" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    deleted: data?.length ?? 0,
    message: "已清除本產品雲端訂閱列。NovaOS 帳號本身未刪除。",
  });
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入拓新雲端" }, { status: 401 });
  }

  const { count, error } = await supabase
    .from("personal_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) {
    console.error("[account/data GET]", error);
    return NextResponse.json({ error: "無法讀取資料筆數" }, { status: 500 });
  }

  return NextResponse.json({
    user_id: user.id,
    subscription_count: count ?? 0,
  });
}
