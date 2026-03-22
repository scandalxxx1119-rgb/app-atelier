"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Post = {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  created_at: string;
  username?: string;
  reply_count?: number;
};

export default function BoardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("aa_board_posts")
      .select("id, user_id, title, content, created_at")
      .order("created_at", { ascending: false });

    if (!data) { setLoading(false); return; }

    const userIds = [...new Set(data.map((p: Post) => p.user_id))];
    const postIds = data.map((p: Post) => p.id);

    const [profilesRes, repliesRes] = await Promise.all([
      supabase.from("aa_profiles").select("id, username").in("id", userIds),
      supabase.from("aa_board_replies").select("id, post_id").in("post_id", postIds),
    ]);

    const profileMap: Record<string, string> = {};
    profilesRes.data?.forEach((p: { id: string; username: string }) => {
      profileMap[p.id] = p.username;
    });

    const replyCount: Record<string, number> = {};
    repliesRes.data?.forEach((r: { id: string; post_id: string }) => {
      replyCount[r.post_id] = (replyCount[r.post_id] ?? 0) + 1;
    });

    setPosts(data.map((p: Post) => ({
      ...p,
      username: profileMap[p.user_id] ?? "匿名",
      reply_count: replyCount[p.id] ?? 0,
    })));
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push("/auth"); return; }
    if (!title.trim()) return;
    setSubmitting(true);
    const { data } = await supabase
      .from("aa_board_posts")
      .insert({ user_id: user.id, title: title.trim(), content: content.trim() || null })
      .select("id, user_id, title, content, created_at").single();
    if (data) {
      const { data: profile } = await supabase
        .from("aa_profiles").select("username").eq("id", user.id).single();
      setPosts((prev) => [{ ...data, username: profile?.username ?? "匿名", reply_count: 0 }, ...prev]);
      setTitle("");
      setContent("");
      setFormOpen(false);
    }
    setSubmitting(false);
  };

  const handleDelete = async (postId: string) => {
    if (!user || !confirm("このスレッドを削除しますか？")) return;
    await supabase.from("aa_board_posts").delete().eq("id", postId).eq("user_id", user.id);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold">💬 意見掲示板</h1>
        {user && !formOpen && (
          <button
            onClick={() => setFormOpen(true)}
            className="px-4 py-1.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 transition-opacity"
          >
            スレッドを立てる
          </button>
        )}
      </div>
      <p className="text-sm text-zinc-500 mb-6">「こんなアプリが欲しい」を投稿しよう。開発者が見ています！</p>

      {formOpen && (
        <form onSubmit={handleSubmit} className="mb-8 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-3">
          <p className="font-semibold text-sm">新しいスレッド</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトル（例：カロリー管理×AIアドバイスのアプリが欲しい）"
            maxLength={100}
            required
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="詳しい説明（任意）"
            maxLength={1000}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none"
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setFormOpen(false)}
              className="px-4 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              キャンセル
            </button>
            <button type="submit" disabled={submitting || !title.trim()}
              className="px-4 py-1.5 text-sm rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:opacity-80 transition-opacity disabled:opacity-40">
              {submitting ? "投稿中..." : "投稿する"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-zinc-400 text-sm">読み込み中...</p>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <p className="text-4xl mb-3">💭</p>
          <p className="text-sm">まだスレッドがありません。最初に投稿してみましょう！</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="group p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
              <Link href={`/board/${post.id}`} className="block">
                <p className="font-semibold text-sm mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {post.title}
                </p>
                {post.content && (
                  <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{post.content}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <span>{post.username}</span>
                  <span>{new Date(post.created_at).toLocaleDateString("ja-JP")}</span>
                  <span>💬 {post.reply_count}</span>
                </div>
              </Link>
              {user?.id === post.user_id && (
                <button
                  onClick={() => handleDelete(post.id)}
                  className="mt-2 text-xs text-zinc-300 dark:text-zinc-600 hover:text-red-500 transition-colors"
                >
                  削除
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
