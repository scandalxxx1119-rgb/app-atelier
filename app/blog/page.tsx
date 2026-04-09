import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ブログ - App Atelier",
  description:
    "個人開発アプリの紹介記事やレビュー、開発ストーリーを掲載。App Atelierに投稿された注目アプリをピックアップしてお届けします。",
  openGraph: {
    title: "ブログ - App Atelier",
    description:
      "個人開発アプリの紹介記事やレビュー、開発ストーリーを掲載。",
    url: "https://appatelier.dev/blog",
    siteName: "App Atelier",
    type: "website",
  },
};

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  tags: string[] | null;
  published_at: string;
  app: { name: string; icon_url: string | null } | null;
};

export default async function BlogListPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: posts } = await supabase
    .from("aa_blog_posts")
    .select(
      "id, slug, title, meta_description, tags, published_at, app:aa_apps!app_id(name, icon_url)"
    )
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  const articles = (posts ?? []) as unknown as BlogPost[];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">ブログ</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          個人開発アプリの紹介・レビュー・開発ストーリー
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl">
          <p className="text-zinc-400 text-sm">記事はまだありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="flex items-start gap-4 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors group"
            >
              {post.app?.icon_url ? (
                <img
                  src={post.app.icon_url}
                  alt=""
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl flex-shrink-0">
                  📝
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                  {post.title}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  {post.meta_description}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <time className="text-[11px] text-zinc-400">
                    {new Date(post.published_at).toLocaleDateString("ja-JP")}
                  </time>
                  {post.app?.name && (
                    <span className="text-[11px] text-purple-500 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                      {post.app.name}
                    </span>
                  )}
                  {post.tags?.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
