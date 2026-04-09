-- ブログ記事テーブル
create table aa_blog_posts (
  id uuid primary key default gen_random_uuid(),
  app_id uuid references aa_apps(id) on delete set null,
  slug text not null unique,
  title text not null,
  content text not null,
  meta_description text not null default '',
  tags text[] default '{}',
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- インデックス
create index idx_blog_posts_slug on aa_blog_posts(slug);
create index idx_blog_posts_published on aa_blog_posts(published_at desc) where published_at is not null;
create index idx_blog_posts_app_id on aa_blog_posts(app_id);

-- RLS
alter table aa_blog_posts enable row level security;

-- 公開記事は誰でも読める
create policy "public read published" on aa_blog_posts
  for select using (published_at is not null and published_at <= now());

-- masterのみCRUD
create policy "master full access" on aa_blog_posts
  for all using (
    exists (
      select 1 from aa_profiles
      where aa_profiles.id = auth.uid()
      and aa_profiles.badge = 'master'
    )
  );
