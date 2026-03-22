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

async function tweetWithReply(client: TwitterApi, mainText: string, replyUrl: string): Promise<void> {
  const mainTweet = await client.v2.tweet({ text: mainText });
  await client.v2.tweet({
    text: replyUrl,
    reply: { in_reply_to_tweet_id: mainTweet.data.id },
  });
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

  // 月曜9時JST - 今週の登録件数ツイート
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase.from("aa_apps")
    .select("*", { count: "exact", head: true })
    .eq("is_hidden", false)
    .gte("created_at", weekAgo);

  if ((count ?? 0) === 0) {
    return NextResponse.json({ ok: true, results: ["no new apps this week"] });
  }

  try {
    await tweetWithReply(
      client,
      `\u{1F4CA} 今週のApp Atelier\n\n新着アプリが${count}件登録されました！\n\nどんなアプリが追加されたか、ぜひチェックしてみてください\u2193`,
      `${SITE_URL}`
    );
    return NextResponse.json({ ok: true, results: [`weekly: ${count}件`] });
  } catch (e) {
    return NextResponse.json({ ok: false, results: [`error: ${e}`] });
  }
}
