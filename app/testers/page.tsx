import Link from "next/link";

export const metadata = { title: "テスター募集とは | App Atelier" };

export default function TestersPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-bold mb-2">テスター募集</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          開発者がアプリのテスターを募集し、フィードバックをもらえる仕組みです。
        </p>
      </div>

      {/* フロー */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">テスターになるまでの流れ</h2>
        <div className="space-y-3">
          {[
            { step: "1", title: "アプリを探す", desc: "一覧から「テスター募集中」のアプリを見つける" },
            { step: "2", title: "申請する", desc: "アプリ詳細ページから参加申請を送る（メッセージ任意）" },
            { step: "3", title: "開発者が承認", desc: "開発者が申請を確認して承認・拒否を決める" },
            { step: "4", title: "ポイント獲得", desc: "承認されると自動でポイントが付与される（1〜5pt）" },
          ].map((s) => (
            <div key={s.step} className="flex gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <div className="w-7 h-7 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {s.step}
              </div>
              <div>
                <p className="font-medium text-sm">{s.title}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 開発者向け */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">開発者のメリット</h2>
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-3">
          {[
            "リリース前に実際のユーザーからフィードバックをもらえる",
            "テスター枠数・付与ポイントを自由に設定できる",
            "申請者を一覧で確認し、承認・拒否を管理できる",
            "テスターが増えることでアプリの注目度が上がる",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
              <span className="text-zinc-900 dark:text-white font-bold flex-shrink-0">✓</span>
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* テスター向け */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">テスターのメリット</h2>
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-3">
          {[
            "リリース前のアプリをいち早く体験できる",
            "承認されるとポイントを獲得できる",
            "個人開発者を直接応援できる",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
              <span className="text-zinc-900 dark:text-white font-bold flex-shrink-0">✓</span>
              {item}
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-3">
        <Link href="/" className="px-5 py-2.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm hover:opacity-80 transition-opacity">
          アプリ一覧を見る
        </Link>
        <Link href="/points" className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
          ポイント制度を見る
        </Link>
      </div>
    </div>
  );
}
