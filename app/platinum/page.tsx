"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PlatinumPage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* ヘッダー */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r from-sky-300 via-cyan-200 to-indigo-300 text-zinc-800 font-bold tracking-widest text-sm mb-4">
          PLATINUM
        </div>
        <h1 className="text-3xl font-bold mb-3">PLATINUMバッジとは？</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          App Atelierに早く登録してくれた開発者への感謝を込めた、特別な限定バッジです。
        </p>
      </div>

      {/* 説明 */}
      <div className="space-y-6 mb-10">
        <div className="p-5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950">
          <h2 className="font-bold mb-2 text-sky-700 dark:text-sky-300">先着150名限定</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            App Atelierに登録した最初の150名だけが取得できるバッジです。
            150名を超えると自動的に付与が終了し、二度と手に入りません。
          </p>
        </div>

        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <h2 className="font-bold mb-3">PLATINUMバッジの特典</h2>
          <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
            <li className="flex items-start gap-2">
              <span className="text-sky-500 font-bold flex-shrink-0">✓</span>
              プロフィールと投稿アプリに水色グラデーションの限定バッジが表示される
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sky-500 font-bold flex-shrink-0">✓</span>
              アプリ一覧で優先表示（通常ユーザーより上位に表示される）
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sky-500 font-bold flex-shrink-0">✓</span>
              スクリーンショットを最大10枚まで投稿可能（通常は5枚）
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sky-500 font-bold flex-shrink-0">✓</span>
              App Atelierの創設メンバーとして記録される
            </li>
          </ul>
        </div>

        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <h2 className="font-bold mb-2">バッジについて</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            PLATINUMバッジは新規登録時に自動で付与されます。
            登録後にバッジが表示されない場合はお問い合わせください。
          </p>
        </div>

        <div className="p-5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950">
          <h2 className="font-bold mb-2 text-amber-700 dark:text-amber-300">注意事項</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            PLATINUMバッジは現時点での特典です。今後のサービス展開により特典内容が変更になる場合があります。
            ポイントと同様に、金銭的な価値はありません。
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        {loggedIn ? (
          <>
            <Link
              href="/profile"
              className="inline-block px-8 py-3 rounded-full bg-gradient-to-r from-sky-400 to-indigo-400 text-white font-bold hover:opacity-90 transition-opacity shadow-md"
            >
              マイページでバッジを確認する
            </Link>
            <p className="text-xs text-zinc-400 mt-3">すでに登録済みです</p>
          </>
        ) : (
          <>
            <Link
              href="/auth"
              className="inline-block px-8 py-3 rounded-full bg-gradient-to-r from-sky-400 to-indigo-400 text-white font-bold hover:opacity-90 transition-opacity shadow-md"
            >
              今すぐ登録してPLATINUMバッジをもらう
            </Link>
            <p className="text-xs text-zinc-400 mt-3">登録は無料です</p>
          </>
        )}
      </div>
    </div>
  );
}
