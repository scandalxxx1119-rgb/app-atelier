"use client";

import Link from "next/link";

type Slide = { title: string; date: string; url: string; desc: string };
const SLIDES: Slide[] = [
  // TODO: スライドを追加する場合はここに追記してください
  // { title: "App Atelier 紹介", date: "2026-03", url: "https://...", desc: "サービス概要スライド" },
];

export default function ResourcesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">資料・プレゼン</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">App Atelierの紹介資料や登壇スライドをまとめています</p>
      </div>

      {/* About */}
      <section className="mb-10 p-6 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white">
        <h2 className="text-lg font-bold mb-3">App Atelierとは</h2>
        <p className="text-sm text-zinc-300 leading-relaxed mb-4">
          個人開発者がアプリを届け、応援し合えるコミュニティプラットフォーム。<br />
          アプリの投稿・テスター募集・バッジ制度・ポイント制度を通じて、<br />
          「作るだけじゃなく、届ける」を実現します。
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "アプリ投稿", icon: "📱" },
            { label: "テスター募集", icon: "🧪" },
            { label: "バッジ制度", icon: "🏅" },
            { label: "ポイント制度", icon: "⭐" },
          ].map((f) => (
            <div key={f.label} className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl mb-1">{f.icon}</div>
              <div className="text-xs font-medium">{f.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          <Link href="/" className="text-sm font-semibold text-white underline underline-offset-2">
            サービスを見る →
          </Link>
        </div>
      </section>

      {/* Slides */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">スライド・登壇資料</h2>
        {SLIDES.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl">
            <p className="text-zinc-400 text-sm">資料は準備中です</p>
          </div>
        ) : (
          <div className="space-y-3">
            {SLIDES.map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl flex-shrink-0">
                  📊
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{s.title}</p>
                  <p className="text-xs text-zinc-400">{s.date} · {s.desc}</p>
                </div>
                <span className="text-xs text-zinc-400 flex-shrink-0">開く →</span>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
