-- Web通知テーブル
create table aa_web_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  type text not null,
  actor_id uuid references auth.users on delete set null,
  app_id uuid references aa_apps(id) on delete cascade,
  message text not null,
  url text,
  is_read boolean default false,
  created_at timestamptz default now()
);
create index idx_web_notif_user on aa_web_notifications(user_id, created_at desc);
alter table aa_web_notifications enable row level security;
create policy "own notifications" on aa_web_notifications for all using (auth.uid() = user_id);

-- テスターフィードバックテーブル
create table aa_tester_feedback (
  id uuid primary key default gen_random_uuid(),
  app_id uuid references aa_apps(id) on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  rating int check (rating between 1 and 5) not null,
  body text check (char_length(body) <= 1000),
  created_at timestamptz default now(),
  unique(app_id, user_id)
);
create index idx_tester_feedback_app on aa_tester_feedback(app_id);
alter table aa_tester_feedback enable row level security;
create policy "approved tester can insert" on aa_tester_feedback for insert with check (
  exists (
    select 1 from aa_tester_applications
    where app_id = aa_tester_feedback.app_id
    and user_id = auth.uid()
    and status = 'approved'
  )
);
create policy "app owner can read" on aa_tester_feedback for select using (
  exists (select 1 from aa_apps where id = aa_tester_feedback.app_id and user_id = auth.uid())
  or auth.uid() = user_id
);
