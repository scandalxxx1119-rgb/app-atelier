import Link from "next/link";

export const metadata = { title: "バッジ制度 | App Atelier" };

const BADGES = [
  {
    name: "MASTER",
    color: "from-purple-400 via-pink-300 to-red-300",
    textColor: "text-purple-700 dark:text-purple-300",
    borderColor: "border-purple-200 dark:border-purple-800",
    bgColor: "bg-purple-50 dark:bg-purple-950",
    condition: "運営が特別に認定した開発者",
    note: "App Atelierへの特別な貢献・影響力が認められた方に運営が付与します。",
    auto: false,
  },
  {
    name: "PLATINUM",
    color: "from-sky-300 via-cyan-200 to-indigo-300",
    textColor: "text-sky-700 dark:text-sky-300",
    borderColor: "border-sky-200 dark:border-sky-800",
    bgColor: "bg-sky-50 dark:bg-sky-950",
    condition: "先着150名限定（付与終了）",
    note: "App Atelierの創設メンバーとして永久に記録されます。付与は終了しており、現在は取得できません。",
    auto: true,
  },
  {
    name: "GOLD",
    color: "from-yellow-300 via-amber-200 to-orange-300",
    textColor: "text-amber-700 dark:text-amber-300",
    borderColor: "border-amber-200 dark:border-amber-800",
    bgColor: "bg-amber-50 dark:bg-amber-950",
    condition: "アプリ5本以上投稿 または いいね累計200以上",
    note: "精力的にアプリを開発・投稿し続けているアクティブな開発者に運営が審査・付与します。",
    auto: false,
  },
  {
    name: "SILVER",
    color: "from-zinc-300 via-slate-200 to-zinc-400",
    textColor: "text-zinc-600 dark:text-zinc-300",
    borderColor: "border-zinc-200 dark:border-zinc-700",
    bgColor: "bg-zinc-50 dark:bg-zinc-900",
    condition: "アプリ3本以上投稿 または いいね累計50以上",
    note: "継続して活動している開発者に運営が審査・付与します。",
    auto: false,
  },
  {
    name: "BRONZE",
    color: "from-orange-300 via-amber-200 to-yellow-200",
    textColor: "text-orange-700 dark:text-orange-300",
    borderColor: "border-orange-200 dark:border-orange-800",
    bgColor: "bg-orange-50 dark:bg-orange-950",
    condition: "アプリを1本以上投稿した開発者",
    note: "初めてアプリを投稿した開発者に運営が審査・付与します。",
    auto: false,
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
          <li>PLATINUM以外のバッジは運営が条件を確認した上で手動で付与します。</li>
          <li>条件を満たしていても自動では付与されません。付与をご希望の場合はお問い合わせください。</li>
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
