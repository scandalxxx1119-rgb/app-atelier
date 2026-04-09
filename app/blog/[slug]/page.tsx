import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string;
  tags: string[] | null;
  published_at: string;
  updated_at: string;
  app_id: string | null;
};

type AppInfo = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon_url: string | null;
  url: string | null;
  app_store_url: string | null;
  play_store_url: string | null;
  tags: string[] | null;
  likes_count: number;
  status: string | null;
};

type RelatedPost = {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  published_at: string;
  app: { name: string; icon_url: string | null } | null;
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function getPost(slug: string) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("aa_blog_posts")
    .select("*")
    .eq("slug", slug)
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .single();
  return data as BlogPost | null;
}

async function getApp(appId: string) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("aa_apps")
    .select(
      "id, name, tagline, description, icon_url, url, app_store_url, play_store_url, tags, likes_count, status"
    )
    .eq("id", appId)
    .single();
  return data as AppInfo | null;
}

async function getRelatedPosts(currentId: string, tags: string[] | null) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("aa_blog_posts")
    .select(
      "id, slug, title, meta_description, published_at, app:aa_apps!app_id(name, icon_url)"
    )
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .neq("id", currentId)
    .order("published_at", { ascending: false })
    .limit(4);
  return (data ?? []) as unknown as RelatedPost[];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "記事が見つかりません - App Atelier" };

  return {
    title: `${post.title} - App Atelier ブログ`,
    description: post.meta_description,
    openGraph: {
      title: post.title,
      description: post.meta_description,
      url: `https://appatelier.dev/blog/${post.slug}`,
      siteName: "App Atelier",
      type: "article",
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.meta_description,
    },
    alternates: {
      canonical: `https://appatelier.dev/blog/${post.slug}`,
    },
  };
}

function renderContent(content: string) {
  // シンプルなMarkdown→HTMLレンダリング
  // 見出し・段落・リスト・太字・リンク・画像に対応
  const lines = content.split("\n");
  const html: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("### ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h3 class="text-lg font-bold mt-8 mb-3 text-zinc-900 dark:text-zinc-100">${esc(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith("## ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h2 class="text-xl font-bold mt-10 mb-4 text-zinc-900 dark:text-zinc-100">${esc(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith("# ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h1 class="text-2xl font-bold mt-10 mb-4 text-zinc-900 dark:text-zinc-100">${esc(trimmed.slice(2))}</h1>`);
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList) { html.push('<ul class="list-disc pl-6 space-y-1 my-4">'); inList = true; }
      html.push(`<li class="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">${inline(trimmed.slice(2))}</li>`);
    } else if (trimmed === "") {
      if (inList) { html.push("</ul>"); inList = false; }
    } else {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<p class="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed my-3">${inline(trimmed)}</p>`);
    }
  }
  if (inList) html.push("</ul>");

  return html.join("\n");
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string) {
  let out = esc(s);
  // 太字
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-zinc-900 dark:text-zinc-100">$1</strong>');
  // リンク
  out = out.replace(
    /\[(.+?)\]\((.+?)\)/g,
    '<a href="$2" class="text-purple-600 dark:text-purple-400 underline underline-offset-2 hover:text-purple-800 dark:hover:text-purple-300" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  // 画像
  out = out.replace(
    /!\[(.+?)\]\((.+?)\)/g,
    '<img src="$2" alt="$1" class="rounded-xl my-4 max-w-full" />'
  );
  return out;
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const app = post.app_id ? await getApp(post.app_id) : null;
  const related = await getRelatedPosts(post.id, post.tags);

  // JSON-LD 構造化データ
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    url: `https://appatelier.dev/blog/${post.slug}`,
    publisher: {
      "@type": "Organization",
      name: "App Atelier",
      url: "https://appatelier.dev",
    },
    ...(app?.icon_url
      ? { image: app.icon_url }
      : {}),
  };

  const statusLabel = (s: string | null) => {
    if (s === "released") return "リリース済み";
    if (s === "beta") return "ベータ版";
    if (s === "dev") return "開発中";
    return s;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* パンくず */}
      <nav className="text-xs text-zinc-400 mb-6 flex items-center gap-1">
        <Link href="/" className="hover:text-zinc-600 dark:hover:text-zinc-200">
          ホーム
        </Link>
        <span>/</span>
        <Link
          href="/blog"
          className="hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          ブログ
        </Link>
        <span>/</span>
        <span className="text-zinc-500 dark:text-zinc-400 truncate max-w-[200px]">
          {post.title}
        </span>
      </nav>

      {/* 記事ヘッダー */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-3 leading-tight">{post.title}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <time className="text-xs text-zinc-400">
            {new Date(post.published_at).toLocaleDateString("ja-JP")}
          </time>
          {post.tags?.map((tag) => (
            <span
              key={tag}
              className="text-[11px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      {/* アプリ情報カード */}
      {app && (
        <div className="mb-8 p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-start gap-4">
            {app.icon_url && (
              <img
                src={app.icon_url}
                alt={app.name}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-base">{app.name}</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {app.tagline}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {app.status && (
                  <span className="text-[11px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                    {statusLabel(app.status)}
                  </span>
                )}
                <span className="text-[11px] text-zinc-400">
                  ❤️ {app.likes_count}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 flex-wrap">
            <Link
              href={`/apps/${app.id}`}
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            >
              App Atelierで見る
            </Link>
            {app.url && (
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium px-3 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                公式サイト
              </a>
            )}
            {app.app_store_url && (
              <a
                href={app.app_store_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium px-3 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                App Store
              </a>
            )}
            {app.play_store_url && (
              <a
                href={app.play_store_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium px-3 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Google Play
              </a>
            )}
          </div>
        </div>
      )}

      {/* 記事本文 */}
      <article
        className="mb-12"
        dangerouslySetInnerHTML={{ __html: renderContent(post.content) }}
      />

      {/* アフィリエイト枠（記事下） */}
      <div id="blog-affiliate" className="my-8" />

      {/* 関連記事 */}
      {related.length > 0 && (
        <section className="border-t border-zinc-200 dark:border-zinc-800 pt-8">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">
            関連記事
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/blog/${r.slug}`}
                className="flex items-start gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors group"
              >
                {r.app?.icon_url ? (
                  <img
                    src={r.app.icon_url}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg flex-shrink-0">
                    📝
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-semibold group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                    {r.title}
                  </h3>
                  <time className="text-[10px] text-zinc-400 mt-1 block">
                    {new Date(r.published_at).toLocaleDateString("ja-JP")}
                  </time>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
