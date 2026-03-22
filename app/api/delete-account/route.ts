import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return new Response("Unauthorized", { status: 401 });

  const token = authHeader.replace("Bearer ", "");

  // JWTを検証してユーザーを特定
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // service_roleで全データ削除
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const uid = user.id;

  // 関連データを順番に削除
  await admin.from("aa_points").delete().eq("user_id", uid);
  await admin.from("aa_likes").delete().eq("user_id", uid);
  await admin.from("aa_comments").delete().eq("user_id", uid);
  await admin.from("aa_tester_applications").delete().eq("user_id", uid);
  await admin.from("aa_app_updates").delete().eq("user_id", uid);
  await admin.from("aa_boosts").delete().eq("user_id", uid);
  await admin.from("aa_follows").delete().or(`follower_id.eq.${uid},following_id.eq.${uid}`);
  await admin.from("aa_bug_reports").delete().eq("user_id", uid);
  await admin.from("aa_reports").delete().eq("reporter_id", uid);
  await admin.from("aa_apps").delete().eq("user_id", uid);
  await admin.from("aa_profiles").delete().eq("id", uid);

  // Authユーザーを削除
  const { error } = await admin.auth.admin.deleteUser(uid);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
