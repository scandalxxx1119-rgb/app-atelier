import Link from "next/link";

export const metadata = { title: "バッジ制度 | App Atelier" };

const BADGES = [
  {
    name: "PLATINUM",
    color: "from-sky-300 via-cyan-200 to-indigo-300",
    textColor: "text-sky-700 dark:text-sky-300",
    borderColor: "border-sky-200 dark:border-sky-800",
    bgColor: "bg-sky-50 dark:bg-sky-950",
    condition: "先着150名限定（付与終了）",
    note: "App Atelierの創設メンバーとして永久に記録されます。大好評で224名に配布済み。付与は終了しており、現在は取得できません。",
    auto: true,
  },
];

export default function BadgesPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-bold mb-2">バッジ制度</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          App Atelierでの活動・貢献に応じてバッジが付与されます。バッジはプロフィールと投稿アプリに表示されます。
        </p>
      </div>

      <section className="space-y-4 mb-10">
        {BADGES.map((b) => (
          <div key={b.name} className={`p-5 rounded-xl border ${b.borderColor} ${b.bgColor}`}>
            <div className="flex items-center gap-3 mb-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r ${b.color} text-zinc-800 font-bold tracking-widest text-xs`}>
                {b.name}
              </span>
              {b.auto && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">付与終了</span>
              )}
            </div>
            <p className={`text-sm font-semibold mb-1 ${b.textColor}`}>{b.condition}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{b.note}</p>
          </div>
        ))}
      </section>

      <section className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 mb-8">
        <h2 className="font-bold mb-2 text-sm">注意事項</h2>
        <ul className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
          <li>PLATINUMバッジの付与は終了しています。</li>
          <li>バッジの条件・内容は今後変更される場合があります。</li>
        </ul>
      </section>

      <div className="flex gap-3">
        <Link href="/platinum" className="px-5 py-2.5 rounded-full bg-gradient-to-r from-sky-400 to-indigo-400 text-white font-medium text-sm hover:opacity-80 transition-opacity">
          PLATINUMバッジの詳細
        </Link>
        <Link href="/" className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
          アプリ一覧を見る
        </Link>
      </div>
    </div>
  );
}
