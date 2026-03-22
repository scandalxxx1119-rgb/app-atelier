import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { TwitterApi } from "twitter-api-v2";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // tweeted_at が null のアプリを1件取得（新着順）
  const { data: app } = await supabase
    .from("aa_apps")
    .select("id, name, tagline")
    .eq("is_hidden", false)
    .is("tweeted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!app) {
    return NextResponse.json({ ok: true, message: "no app to tweet" });
  }

  const client = new TwitterApi({
    appKey: process.env.X_API_KEY!,
    appSecret: process.env.X_API_SECRET!,
    accessToken: process.env.X_ACCESS_TOKEN!,
    accessSecret: process.env.X_ACCESS_SECRET!,
  });

  const text = `${app.name} - ${app.tagline}\n\nhttps://app-atelier.vercel.app/apps/${app.id}`;

  await client.v2.tweet(text);

  await supabase
    .from("aa_apps")
    .update({ tweeted_at: new Date().toISOString() })
    .eq("id", app.id);

  return NextResponse.json({ ok: true, tweeted: app.name });
}
