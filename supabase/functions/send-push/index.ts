import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EXPO_PUSH_URL = "https://exp.host/--/expoapi/v2/push/send";

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: Record<string, unknown>;
  old_record: Record<string, unknown> | null;
};

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json();
  const { type, table, record, old_record } = payload;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  let targetUserId: string | null = null;
  let title = "";
  let body = "";
  let appId: string | null = null;

  if (table === "aa_likes" && type === "INSERT") {
    const { data: app } = await supabase
      .from("aa_apps")
      .select("user_id, name")
      .eq("id", record.app_id)
      .single();

    if (!app || app.user_id === record.user_id) return new Response("ok");

    targetUserId = app.user_id;
    title = "いいねされました！";
    body = `${app.name} にいいねが付きました`;
    appId = record.app_id as string;

  } else if (table === "aa_comments" && type === "INSERT") {
    const { data: app } = await supabase
      .from("aa_apps")
      .select("user_id, name")
      .eq("id", record.app_id)
      .single();

    if (!app || app.user_id === record.user_id) return new Response("ok");

    targetUserId = app.user_id;
    title = "コメントが届きました";
    const content = record.content as string;
    body = content.length > 50 ? content.slice(0, 50) + "..." : content;
    appId = record.app_id as string;

  } else if (table === "aa_tester_applications" && type === "UPDATE") {
    if (record.status === "approved" && old_record?.status !== "approved") {
      const { data: app } = await supabase
        .from("aa_apps")
        .select("name")
        .eq("id", record.app_id)
        .single();

      targetUserId = record.user_id as string;
      title = "テスター申請が承認されました！";
      body = `${app?.name ?? "アプリ"} のテスターに承認されました`;
      appId = record.app_id as string;
    }
  }

  if (!targetUserId) return new Response("ok");

  const { data: tokens } = await supabase
    .from("aa_push_tokens")
    .select("token")
    .eq("user_id", targetUserId);

  if (!tokens?.length) return new Response("ok");

  const messages = tokens.map((t: { token: string }) => ({
    to: t.token,
    title,
    body,
    data: { app_id: appId },
    sound: "default",
  }));

  await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });

  return new Response("ok");
});
