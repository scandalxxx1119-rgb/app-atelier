import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { TwitterApi } from "twitter-api-v2";

const SITE_URL = "https://appatelier.dev";

function getClient() {
  return new TwitterApi({
    appKey: process.env.X_API_KEY!,
    appSecret: process.env.X_API_SECRET!,
    accessToken: process.env.X_ACCESS_TOKEN!,
    accessSecret: process.env.X_ACCESS_SECRET!,
  });
}

async function uploadIcon(client: TwitterApi, iconUrl: string): Promise<string | undefined> {
  try {
    const res = await fetch(iconUrl);
    const buf = Buffer.from(await res.arrayBuffer());
    const mimeType = iconUrl.includes(".png") ? "image/png" : "image/jpeg";
    return await client.v1.uploadMedia(buf, { mimeType });
  } catch {
    return undefined;
  }
}

async function tweetWithReply(client: TwitterApi, mainText: string, replyUrl: string, mediaId?: string): Promise<string> {
  const mainTweet = await client.v2.tweet({
    text: mainText,
    ...(mediaId ? { media: { media_ids: [mediaId] } } : {}),
  });
  await client.v2.tweet({
    text: replyUrl,
    reply: { in_reply_to_tweet_id: mainTweet.data.id },
  });
  return mainTweet.data.id;
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const client = getClient();

  // 21:00 JST - 掲載古い順で1件紹介
  const { data: app } = await supabase
    .from("aa_apps")
    .select("id, name, tagline, icon_url")
    .eq("is_hidden", false)
    .is("tweeted_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!app) {
    return NextResponse.json({ ok: true, results: ["no apps to tweet"] });
  }

  try {
    const mediaId = app.icon_url ? await uploadIcon(client, app.icon_url) : undefined;
    const tweetId = await tweetWithReply(
      client,
      `\u{1F4F1} 今日のアプリ紹介\n\n${app.name}\n${app.tagline}\n\nこちらから\u2193`,
      `${SITE_URL}/apps/${app.id}`,
      mediaId
    );
    await supabase.from("aa_apps").update({ tweeted_at: new Date().toISOString(), tweet_id: tweetId }).eq("id", app.id);
    return NextResponse.json({ ok: true, results: [`daily: ${app.name}`] });
  } catch (e) {
    return NextResponse.json({ ok: false, results: [`error: ${e}`] });
  }
}
