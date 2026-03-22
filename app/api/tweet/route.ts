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
  replyUrl: string,
  mediaId?: string
): Promise<string> {
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
  if (secret && auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const client = getClient();
  const results: string[] = [];

  if (mode === "daily") {
    // 21:00 JST - 掲載古い順で1件紹介
    const { data: app } = await supabase
      .from("aa_apps")
      .select("id, name, tagline, icon_url")
      .eq("is_hidden", false)
      .is("tweeted_at", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (app) {
      try {
        const mediaId = app.icon_url ? await uploadIcon(client, app.icon_url) : undefined;
        const tweetId = await tweetWithReply(
          client,
          `\u{1F4F1} \u4ECA\u65E5\u306E\u30A2\u30D7\u30EA\u7D39\u4ECB\n\n${app.name}\n${app.tagline}\n\n\u3053\u3061\u3089\u304B\u3089\u2193`,
          `${SITE_URL}/apps/${app.id}`,
          mediaId
        );
        await supabase.from("aa_apps").update({ tweeted_at: new Date().toISOString(), tweet_id: tweetId }).eq("id", app.id);
        results.push(`daily: ${app.name}`);
      } catch (e) {
        results.push(`error (daily): ${e}`);
      }
    }
  } else {
    // 8/12/19 JST - 新着1件（新しい順）+ ブースト1件
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
        const tweetId = await tweetWithReply(
          client,
          `\u{1F3A8} \u65B0\u7740\u30A2\u30D7\u30EA\uFF01\n\n${newApp.name}\n${newApp.tagline}\n\n\u3053\u3061\u3089\u304B\u3089\u2193`,
          `${SITE_URL}/apps/${newApp.id}`,
          mediaId
        );
        await supabase.from("aa_apps").update({ tweeted_at: new Date().toISOString(), tweet_id: tweetId }).eq("id", newApp.id);
        results.push(`new: ${newApp.name}`);
      } catch (e) {
        results.push(`error (new): ${e}`);
      }
    }

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
            `\u{1F680} \u6CE8\u76EE\u30A2\u30D7\u30EA\uFF01\n\n${app.name}\n${app.tagline}\n\n\u3053\u3061\u3089\u304B\u3089\u2193`,
            `${SITE_URL}/apps/${app.id}`,
            mediaId
          );
          await supabase.from("aa_boosts").update({ tweeted_at: new Date().toISOString() }).eq("id", boost.id);
          results.push(`boost: ${app.name}`);
        } catch (e) {
          results.push(`error (boost): ${e}`);
        }
      }
    }
  }

  return NextResponse.json({ ok: true, results });
}
