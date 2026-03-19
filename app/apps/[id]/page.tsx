"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type App = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string | null;
  icon_url: string | null;
  screenshot_urls: string[] | null;
  tags: string[] | null;
  likes_count: number;
  created_at: string;
  user_id: string;
  twitter_url: string | null;
  youtube_url: string | null;
  aa_profiles: { username: string } | null;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  aa_profiles: { username: string } | null;
};

function getYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&\n?#]+)/
  );
  return match ? match[1] : null;
}

export default function AppDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [app, setApp] = useState<App | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeShot, setActiveShot] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    supabase
      .from("aa_apps")
      .select("*, aa_profiles(username)")
      .eq("id", id)
      .single()
      .then(({ data }) => setApp(data as App));

    supabase
      .from("aa_comments")
      .select("*, aa_profiles(username)")
      .eq("app_id", id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setComments((data as Comment[]) ?? []));
  }, [id]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("aa_likes")
      .select("id")
      .eq("app_id", id)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setLiked(!!data));
  }, [user, id]);

  const handleLike = async () => {
    if (!user) {
      router.push("/auth");
      return;
    }
    if (liked) {
      await supabase
        .from("aa_likes")
        .delete()
        .eq("app_id", id)
        .eq("user_id", user.id);
      setLiked(false);
      setApp((a) =>
        a ? { ...a, likes_count: Math.max(0, a.likes_count - 1) } : a
      );
    } else {
      await supabase
        .from("aa_likes")
        .insert({ app_id: id, user_id: user.id });
      setLiked(true);
      setApp((a) => (a ? { ...a, likes_count: a.likes_count + 1 } : a));
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !comment.trim()) return;
    setSubmitting(true);
    const { data } = await supabase
      .from("aa_comments")
      .insert({ app_id: id, user_id: user.id, content: comment.trim() })
      .select("*, aa_profiles(username)")
      .single();
    if (data) setComments((prev) => [...prev, data as Comment]);
    setComment("");
    setSubmitting(false);
  };

  if (!app) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        <div className="h-8 w-48 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="h-4 w-2/3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
      </div>
    );
  }

  const youtubeId = app.youtube_url ? getYoutubeId(app.youtube_url) : null;
  const shots = app.screenshot_urls ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* App header */}
      <div className="flex items-start gap-5 mb-6">
        {app.icon_url ? (
          <img
            src={app.icon_url}
            alt={app.name}
            className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-3xl font-bold text-zinc-400 flex-shrink-0">
            {app.name[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold mb-1">{app.name}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-2">{app.tagline}</p>
          <p className="text-xs text-zinc-400">
            by {app.aa_profiles?.username ?? "anonymous"}
          </p>
        </div>
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1 group"
        >
          <span
            className={`text-2xl transition-all duration-150 group-active:scale-125 ${
              liked
                ? "text-red-500"
                : "text-zinc-300 dark:text-zinc-600 hover:text-red-400"
            }`}
          >
            ♥
          </span>
          <span className="text-sm text-zinc-500">{app.likes_count}</span>
        </button>
      </div>

      {/* Tags & Links */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {app.tags?.map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-1 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
          >
            {tag}
          </span>
        ))}
        <div className="ml-auto flex items-center gap-3">
          {app.twitter_url && (
            <a
              href={app.twitter_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              𝕏 フォロー
            </a>
          )}
          {app.url && (
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
            >
              サイトを見る →
            </a>
          )}
        </div>
      </div>

      {/* YouTube embed */}
      {youtubeId && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
            デモ動画
          </h2>
          <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: "56.25%" }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title="YouTube video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Screenshots */}
      {shots.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
            スクリーンショット
          </h2>
          <div className="rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 mb-2">
            <img
              src={shots[activeShot]}
              alt={`screenshot ${activeShot + 1}`}
              className="w-full object-contain max-h-80"
            />
          </div>
          {shots.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {shots.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveShot(i)}
                  className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === activeShot
                      ? "border-zinc-900 dark:border-white"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={src}
                    alt={`thumb ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {app.description && (
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
            About
          </h2>
          <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {app.description}
          </p>
        </div>
      )}

      {/* Comments */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">
          コメント（{comments.length}）
        </h2>
        <div className="space-y-4 mb-6">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-medium flex-shrink-0">
                {(c.aa_profiles?.username ?? "?")[0].toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">
                  {c.aa_profiles?.username ?? "anonymous"}
                </p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {c.content}
                </p>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-zinc-400">コメントはまだありません</p>
          )}
        </div>
        <form onSubmit={handleComment} className="flex gap-2">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={user ? "コメントを書く..." : "ログインしてコメント"}
            disabled={!user}
            className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!user || submitting || !comment.trim()}
            className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            送信
          </button>
        </form>
      </div>
    </div>
  );
}
