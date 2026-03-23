import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const COSTS: Record<string, number> = {
  normal: 30,
  super: 100,
  premium: 300,
};

function weightedRarity(): string {
  const roll = Math.random() * 100;
  if (roll < 1) return "legendary";
  if (roll < 6) return "epic";
  if (roll < 34) return "rare";
  return "common";
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return new Response("Unauthorized", { status: 401 });
  const token = authHeader.replace("Bearer ", "");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { type } = await req.json();
  const cost = COSTS[type];
  if (!cost) return NextResponse.json({ error: "Invalid gacha type" }, { status: 400 });

  // ポイント確認
  const { data: points } = await admin
    .from("aa_points")
    .select("amount")
    .eq("user_id", user.id);
  const total = (points ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0);
  if (total < cost) {
    return NextResponse.json({ error: "ポイントが足りません" }, { status: 400 });
  }

  let resultItem = null;
  let insertData: Record<string, unknown> = { user_id: user.id };

  if (type === "normal") {
    // 所持済みitem_idを取得
    const { data: inventory } = await admin
      .from("aa_gacha_inventory")
      .select("item_id")
      .eq("user_id", user.id)
      .not("item_id", "is", null);
    const ownedIds = new Set((inventory ?? []).map((i: { item_id: string }) => i.item_id));

    const { data: items } = await admin
      .from("aa_gacha_items")
      .select("*")
      .eq("gacha_type", "normal");
    const available = (items ?? []).filter((i: { id: string }) => !ownedIds.has(i.id));
    if (available.length === 0) {
      return NextResponse.json({ error: "全色コンプリート済みです！" }, { status: 400 });
    }
    resultItem = available[Math.floor(Math.random() * available.length)];
    insertData = { ...insertData, item_id: resultItem.id };

  } else if (type === "super") {
    const rarity = weightedRarity();
    const { data: items } = await admin
      .from("aa_gacha_items")
      .select("*")
      .eq("gacha_type", "super")
      .eq("rarity", rarity);
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "アイテムが見つかりません" }, { status: 500 });
    }
    resultItem = items[Math.floor(Math.random() * items.length)];
    insertData = { ...insertData, item_id: resultItem.id };

  } else if (type === "premium") {
    // 所持済みapp_idを取得
    const { data: inventory } = await admin
      .from("aa_gacha_inventory")
      .select("app_id")
      .eq("user_id", user.id)
      .not("app_id", "is", null);
    const ownedAppIds = new Set((inventory ?? []).map((i: { app_id: string }) => i.app_id));

    const { data: apps } = await admin
      .from("aa_apps")
      .select("id, name, icon_url")
      .order("created_at", { ascending: true })
      .limit(100);

    const available = (apps ?? []).filter((a: { id: string }) => !ownedAppIds.has(a.id));
    if (available.length === 0) {
      return NextResponse.json({ error: "1〜100番目のアプリを全部ゲット済み！" }, { status: 400 });
    }
    const app = available[Math.floor(Math.random() * available.length)];
    resultItem = { id: app.id, gacha_type: "premium", category: "app_card", name: app.name, value: app.id, icon_url: app.icon_url, rarity: "unique" };
    insertData = { ...insertData, app_id: app.id };
  }

  if (!resultItem) return NextResponse.json({ error: "アイテム取得失敗" }, { status: 500 });

  // ポイント消費
  await admin.from("aa_points").insert({
    user_id: user.id,
    amount: -cost,
    reason: `${type === "normal" ? "ノーマル" : type === "super" ? "スーパー" : "プレミアム"}ガチャ`,
  });

  // インベントリに追加
  await admin.from("aa_gacha_inventory").insert(insertData);

  return NextResponse.json({ ok: true, item: resultItem });
}
