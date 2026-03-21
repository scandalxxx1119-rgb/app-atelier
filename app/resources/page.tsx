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

      {/* 開発背景 */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">開発背景</h2>
        <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-4 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
          <p>
            もともと自分自身がアプリ開発の初心者で、テスター募集のやり方もわからず、個人開発だから気軽に頼める人もいない。そんな状況で、せっかく作ったアプリを世に出せないまま終わるのは悲しいと感じていました。
          </p>
          <p>
            Xで調べていると、同じようにテスターを探している個人開発者を見つけました。そこで気づいたんです。個人が開発した良いアプリやゲームが、世に出されなかったり、出ても埋もれてしまうのはもったいないと。
          </p>
          <p>
            Xや他にも個人開発向けのプラットフォームはあるけれど、知らなかったり使い方がわからなかったりする人も多い。それなら自分で作ってしまおうと思いました。
          </p>
          <p className="font-medium text-zinc-800 dark:text-zinc-100">
            個人開発だけど、個人開発者が集まってアトリエのようになれたら——それがApp Atelierの原点です。
          </p>
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
