"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function WelcomePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth"); return; }
      const { data: profile } = await supabase
        .from("aa_profiles").select("username").eq("id", data.user.id).single();
      setUsername(profile?.username ?? "");
    });
  }, [router]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <div className="text-5xl mb-4">🎨</div>
        <h1 className="text-2xl font-bold mb-2">
          {username ? `${username} さん、` : ""}ようこそ App Atelier へ！
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-10 text-sm">
          個人開発者のアプリが集まるコミュニティです。<br />
          まず何をしますか？
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => router.push("/")}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950 transition-all group"
          >
            <span className="text-3xl">👀</span>
            <div>
              <p className="font-semibold text-sm mb-1">アプリを探す</p>
              <p className="text-xs text-zinc-400">いいねして+1pt</p>
            </div>
          </button>

          <button
            onClick={() => router.push("/testers")}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all group"
          >
            <span className="text-3xl">🧪</span>
            <div>
              <p className="font-semibold text-sm mb-1">テスターになる</p>
              <p className="text-xs text-zinc-400">承認で最大5pt獲得</p>
            </div>
          </button>

          <button
            onClick={() => router.push("/submit")}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950 transition-all group"
          >
            <span className="text-3xl">🚀</span>
            <div>
              <p className="font-semibold text-sm mb-1">アプリを投稿する</p>
              <p className="text-xs text-zinc-400">開発者として発信</p>
            </div>
          </button>
        </div>

        <div className="text-xs text-zinc-400 space-y-1 mb-6 bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4">
          <p className="font-medium text-zinc-500 dark:text-zinc-300 mb-2">ポイントの使い方</p>
          <p>いいね・コメント・テスター・シェアなどでポイントが貯まります</p>
          <p>貯めたptでアプリを <strong>ブースト</strong>（注目枠に掲載）できます</p>
          <button onClick={() => router.push("/points")} className="underline text-violet-500 hover:text-violet-700 mt-1">
            詳しく見る →
          </button>
        </div>

        <button
          onClick={() => router.push("/")}
          className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 underline"
        >
          スキップしてホームへ
        </button>
      </div>
    </div>
  );
}
