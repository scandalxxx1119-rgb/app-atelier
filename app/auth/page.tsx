"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/update-password`,
        });
        if (error) throw error;
        setDone(true);
        setLoading(false);
        return;
      }

      if (mode === "signup") {
        // 予約語チェック
        const RESERVED = ["admin", "master", "administrator", "root", "support", "official", "appatelier", "app_atelier", "system", "moderator", "mod", "staff", "help"];
        const trimmedUsername = (username.trim() || email.split("@")[0]).toLowerCase();
        if (RESERVED.includes(trimmedUsername)) {
          setError("そのユーザー名は使用できません");
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;

        // メール確認不要の場合はすぐにログインできる
        if (data.session) {
          // プロフィール作成
          if (data.user) {
            await supabase.from("aa_profiles").upsert(
              {
                id: data.user.id,
                username: username.trim() || email.split("@")[0],
              },
              { onConflict: "id" }
            );
            // 新規登録ボーナス
            await supabase.from("aa_points").insert({
              user_id: data.user.id,
              amount: 10,
              reason: "新規登録ボーナス",
            });
          }
          router.push("/welcome");
        } else {
          // メール確認が必要な場合
          setDone(true);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // プロフィールがなければ作成
        if (data.user) {
          const { data: profile } = await supabase
            .from("aa_profiles")
            .select("id")
            .eq("id", data.user.id)
            .maybeSingle();

          if (!profile) {
            await supabase.from("aa_profiles").upsert(
              {
                id: data.user.id,
                username: email.split("@")[0],
              },
              { onConflict: "id" }
            );
          }
        }

        router.push("/");
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "エラーが発生しました";
      // エラーメッセージを日本語に
      if (msg.includes("Invalid login credentials")) {
        setError("メールアドレスまたはパスワードが間違っています");
      } else if (msg.includes("Email not confirmed")) {
        setError("メールの確認が必要です。受信箱を確認してください");
      } else if (msg.includes("User already registered")) {
        setError("このメールアドレスはすでに登録されています");
      } else if (msg.includes("Password should be at least")) {
        setError("パスワードは6文字以上にしてください");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3 px-4">
          <p className="text-3xl">📧</p>
          <p className="text-xl font-semibold">
            {mode === "reset" ? "リセットメールを送信しました" : "確認メールを送信しました"}
          </p>
          <p className="text-zinc-500 text-sm">
            {mode === "reset"
              ? "メール内のリンクからパスワードを再設定してください"
              : "メール内のリンクをクリックして登録を完了してください"}
          </p>
          <button
            onClick={() => { setDone(false); setMode("login"); }}
            className="mt-4 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline"
          >
            ログイン画面に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-sm">
        {/* Tab */}
        <div className="flex mb-6 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              mode === "login"
                ? "border-b-2 border-zinc-900 dark:border-white text-zinc-900 dark:text-white"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            }`}
          >
            ログイン
          </button>
          <button
            onClick={() => { setMode("signup"); setError(""); }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              mode === "signup"
                ? "border-b-2 border-zinc-900 dark:border-white text-zinc-900 dark:text-white"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            }`}
          >
            新規登録
          </button>
        </div>

        {mode === "reset" && (
          <p className="text-sm text-zinc-500 mb-4">
            登録済みのメールアドレスを入力してください。パスワード再設定のリンクを送ります。
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium mb-1">
                ユーザー名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_name"
                maxLength={30}
                className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="6文字以上"
              minLength={6}
              className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 text-sm"
            />
          </div>

          {mode === "signup" && (
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 flex-shrink-0"
              />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                <a href="/terms" target="_blank" className="underline hover:text-zinc-900 dark:hover:text-zinc-100">利用規約</a>および
                <a href="/privacy" target="_blank" className="underline hover:text-zinc-900 dark:hover:text-zinc-100">プライバシーポリシー</a>
                に同意します
              </span>
            </label>
          )}

          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (mode === "signup" && !agreedToTerms)}
            className="w-full py-2.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:opacity-80 transition-opacity disabled:opacity-50 text-sm"
          >
            {loading
              ? "処理中..."
              : mode === "login"
              ? "ログイン"
              : mode === "reset"
              ? "リセットメールを送る"
              : "登録する"}
          </button>

          {mode === "login" && (
            <button
              type="button"
              onClick={() => { setMode("reset"); setError(""); }}
              className="w-full text-center text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              パスワードを忘れた方はこちら
            </button>
          )}
          {mode === "reset" && (
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); }}
              className="w-full text-center text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              ログインに戻る
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
