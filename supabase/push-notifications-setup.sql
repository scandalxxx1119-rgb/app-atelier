-- =============================================
-- Push Notifications Setup
-- Supabase SQL Editorで実行してください
-- =============================================

-- 1. aa_push_tokens テーブル作成
create table if not exists aa_push_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  token text not null,
  created_at timestamptz default now(),
  unique(user_id, token)
);

alter table aa_push_tokens enable row level security;

create policy "Users can manage their own push tokens"
  on aa_push_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================
-- 2. Supabase Dashboard で Database Webhooks を設定
-- =============================================
-- Dashboard > Database > Webhooks > Create new webhook
--
-- [いいね通知]
--   Name: notify-like
--   Table: aa_likes
--   Events: INSERT
--   URL: https://<project-ref>.supabase.co/functions/v1/send-push
--   Headers: Authorization: Bearer <service_role_key>
--
-- [コメント通知]
--   Name: notify-comment
--   Table: aa_comments
--   Events: INSERT
--   URL: https://<project-ref>.supabase.co/functions/v1/send-push
--   Headers: Authorization: Bearer <service_role_key>
--
-- [テスター承認通知]
--   Name: notify-tester-approved
--   Table: aa_tester_applications
--   Events: UPDATE
--   URL: https://<project-ref>.supabase.co/functions/v1/send-push
--   Headers: Authorization: Bearer <service_role_key>

-- =============================================
-- 3. Edge Function のデプロイ
-- =============================================
-- ターミナルで実行:
--   supabase functions deploy send-push --project-ref <project-ref>
