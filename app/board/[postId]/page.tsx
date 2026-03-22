"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
};

type Reply = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  username?: string;
};

export default function BoardPostPage() {
  const { postId } = useParams<{ postId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    Promise.all([
      supabase.from("aa_board_posts").select("*").eq("id", postId).single(),
      supabase.from("aa_board_replies").select("*").eq("post_id", postId).order("created_at", { ascending: true }),
    ]).then(async ([postRes, repliesRes]) => {
      if (!postRes.data) { router.push("/board"); return; }

      const userIds = [
        postRes.data.user_id,
        ...((repliesRes.data ?? []).map((r: Reply) => r.user_id)),
      ];
      const uniqueIds = [...new Set(userIds)];
      const { data: profiles } = await supabase
        .from("aa_profiles").select("id, username").in("id", uniqueIds);

      const profileMap: Record<string, string> = {};
      profiles?.forEach((p: { id: string; username: string }) => {
        profileMap[p.id] = p.username;
      });

      setPost({ ...postRes.data, username: profileMap[postRes.data.user_id] ?? "匿名" });
      setReplies((repliesRes.data ?? []).map((r: Reply) => ({
        ...r,
        username: profileMap[r.user_id] ?? "匿名",
      })));
      setLoading(false);
    });
  }, [postId]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push("/auth"); return; }
    if (!replyText.trim()) return;
    setSubmitting(true);
    const { data } = await supabase
      .from("aa_board_replies")
      .insert({ post_id: postId, user_id: user.id, content: replyText.trim() })
      .select("*").single();
    if (data) {
      const { data: profile } = await supabase
        .from("aa_profiles").select("username").eq("id", user.id).single();
      setReplies((prev) => [...prev, { ...data, username: profile?.username ?? "匿名" }]);
      setReplyText("");
    }
    setSubmitting(false);
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!user) return;
    await supabase.from("aa_board_replies").delete().eq("id", replyId).eq("user_id", user.id);
    setReplies((prev) => prev.filter((r) => r.id !== replyId));
  };

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-10 text-zinc-400 text-sm">読み込み中...</div>;
  if (!post) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/board" className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 mb-6 inline-block">
        ← 掲示板に戻る
      </Link>

      {/* 元の投稿 */}
      <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 mb-6">
        <h1 className="font-bold text-base mb-2">{post.title}</h1>
        {post.content && (
          <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap mb-3">{post.content}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span>{post.username}</span>
          <span>{new Date(post.created_at).toLocaleDateString("ja-JP")}</span>
        </div>
      </div>

      {/* リプライ一覧 */}
      <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-3">
        返信 {replies.length}件
      </p>
      <div className="space-y-3 mb-8">
        {replies.map((reply) => (
          <div key={reply.id} className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
            <p className="text-sm whitespace-pre-wrap mb-2">{reply.content}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span>{reply.username}</span>
                <span>{new Date(reply.created_at).toLocaleDateString("ja-JP")}</span>
              </div>
              {user?.id === reply.user_id && (
                <button
                  onClick={() => handleDeleteReply(reply.id)}
                  className="text-xs text-zinc-300 dark:text-zinc-600 hover:text-red-500 transition-colors"
                >
                  削除
                </button>
              )}
            </div>
          </div>
        ))}
        {replies.length === 0 && (
          <p className="text-sm text-zinc-400 py-4 text-center">まだ返信がありません</p>
        )}
      </div>

      {/* 返信フォーム */}
      {user ? (
        <form onSubmit={handleReply} className="space-y-3">
          <p className="text-sm font-semibold">返信する</p>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="返信を入力（開発者のコメント歓迎！）"
            maxLength={500}
            rows={4}
            required
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-400">{replyText.length}/500</span>
            <button
              type="submit"
              disabled={submitting || !replyText.trim()}
              className="px-5 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-40"
            >
              {submitting ? "送信中..." : "返信する"}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center py-6 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl">
          <p className="text-sm text-zinc-500 mb-3">返信するにはログインが必要です</p>
          <Link href="/auth"
            className="px-4 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 transition-opacity">
            ログイン
          </Link>
        </div>
      )}
    </div>
  );
}
