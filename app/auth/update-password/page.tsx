"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function UpdatePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) { setLinkError(true); return; }
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) { setLinkError(true); return; }
      setReady(true);
    });
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("パスワードが一致しません"); return; }
    if (password.length < 6) { setError("パスワードは6文字以上にしてください"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError("パスワードの更新に失敗しました");
      setLoading(false);
    } else {
      router.push("/profile");
    }
  };

  if (linkError) {
    return (
      <div className="w-full max-w-sm text-center space-y-4">
        <p className="text-2xl">⚠️</p>
        <h1 className="text-lg font-bold">リンクが無効です</h1>
        <p className="text-sm text-zinc-500">
          パスワードリセットリンクの有効期限が切れているか、すでに使用済みです。
        </p>
        <a
          href="/auth"
          className="inline-block mt-2 px-5 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 transition-opacity"
        >
          ログインページへ戻る
        </a>
        <p className="text-xs text-zinc-400">
          ログインページの「パスワードを忘れた方」から再度リセットメールを送信できます。
        </p>
      </div>
    );
  }

  if (!ready) {
    return <p className="text-zinc-400 text-sm">認証処理中...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <h1 className="text-xl font-bold mb-6">新しいパスワードを設定</h1>
      <div>
        <label className="block text-sm font-medium mb-1">新しいパスワード</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          placeholder="6文字以上"
          className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">確認</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={6}
          placeholder="もう一度入力"
          className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 text-sm"
        />
      </div>
      {error && (
        <div className="px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:opacity-80 transition-opacity disabled:opacity-50 text-sm"
      >
        {loading ? "更新中..." : "パスワードを更新する"}
      </button>
    </form>
  );
}

export default function UpdatePasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Suspense fallback={<p className="text-zinc-400 text-sm">読み込み中...</p>}>
        <UpdatePasswordForm />
      </Suspense>
    </div>
  );
}
