"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function FeedbackPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/auth"); return; }
      setUser(data.user);
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !content.trim()) return;
    setSubmitting(true);
    setError("");
    const { error } = await supabase.from("aa_bug_reports").insert({
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
    });
    if (error) {
      setError("送信に失敗しました。時間をおいて再試行してください。");
      setSubmitting(false);
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-6">✓</div>
        <h1 className="text-xl font-bold mb-2">報告ありがとうございます</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
          内容を確認して対応します。
        </p>
        <Link href="/" className="text-sm text-zinc-400 hover:underline">ホームへ戻る</Link>
      </div>
    );
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 text-sm";

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Link href="/" className="text-sm text-zinc-400 hover:underline mb-6 block">← ホーム</Link>
      <h1 className="text-2xl font-bold mb-2">不具合・フィードバック報告</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
        バグ、使いにくい点、要望など何でもお気軽にどうぞ。
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">タイトル *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
            placeholder="例: ログインできない、いいねが反映されない"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">詳細 *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={6}
            maxLength={2000}
            placeholder="どのページで、何をしたときに発生したか、どんな症状かを書いてください"
            className={`${inputCls} resize-none`}
          />
          <p className="text-xs text-zinc-400 mt-1 text-right">{content.length}/2000</p>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !title.trim() || !content.trim()}
          className="w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-40"
        >
          {submitting ? "送信中..." : "送信する"}
        </button>
      </form>
    </div>
  );
}
