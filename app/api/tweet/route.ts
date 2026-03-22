import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { TwitterApi } from "twitter-api-v2";

const SITE_URL = "https://app-atelier.vercel.app";

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

async function tweetWithReply(
  client: TwitterApi,
  mainText: string,
  replyText: string,
  mediaId?: string
) {
  const mainTweet = await client.v2.tweet({
    text: mainText,
    ...(mediaId ? { media: { media_ids: [mediaId] } } : {}),
  });
  await client.v2.tweet({
    text: replyText,
    reply: { in_reply_to_tweet_id: mainTweet.data.id },
  });
}

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
  const client = getClient();
  const results: string[] = [];

  // 1. 新着アプリ
  const { data: newApp } = await supabase
    .from("aa_apps")
    .select("id, name, tagline, icon_url")
    .eq("is_hidden", false)
    .is("tweeted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (newApp) {
    try {
      const mediaId = newApp.icon_url ? await uploadIcon(client, newApp.icon_url) : undefined;
      await tweetWithReply(
        client,
        `\u{1F3A8} \u65B0\u7740\u30A2\u30D7\u30EA\uFF01\n\n${newApp.name}\n${newApp.tagline}`,
        `App Atelier\u3067\u8A73\u3057\u304F\u898B\u308B\uD83D\uDC47\n${SITE_URL}/apps/${newApp.id}`,
        mediaId
      );
      await supabase.from("aa_apps").update({ tweeted_at: new Date().toISOString() }).eq("id", newApp.id);
      results.push(`new: ${newApp.name}`);
    } catch (e) {
      results.push(`error (new): ${e}`);
    }
  }

  // 2. ブースト
  const { data: boost } = await supabase
    .from("aa_boosts")
    .select("id, app_id, aa_apps(id, name, tagline, icon_url, is_hidden)")
    .is("tweeted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (boost?.aa_apps) {
    const app = boost.aa_apps as unknown as { id: string; name: string; tagline: string; icon_url: string | null; is_hidden: boolean };
    if (!app.is_hidden) {
      try {
        const mediaId = app.icon_url ? await uploadIcon(client, app.icon_url) : undefined;
        await tweetWithReply(
          client,
          `\u{1F680} \u6CE8\u76EE\u30A2\u30D7\u30EA\uFF01\n\n${app.name}\n${app.tagline}`,
          `App Atelier\u3067\u8A73\u3057\u304F\u898B\u308B\uD83D\uDC47\n${SITE_URL}/apps/${app.id}`,
          mediaId
        );
        await supabase.from("aa_boosts").update({ tweeted_at: new Date().toISOString() }).eq("id", boost.id);
        results.push(`boost: ${app.name}`);
      } catch (e) {
        results.push(`error (boost): ${e}`);
      }
    }
  }

  return NextResponse.json({ ok: true, results });
}
