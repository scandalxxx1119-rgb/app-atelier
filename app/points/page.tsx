export const metadata = { title: "ポイント制度 | App Atelier" };

export default function PointsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-bold mb-2">ポイント制度</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          App Atelierでは、アプリの応援や貢献に応じてポイントを獲得・消費できます。
        </p>
      </div>

      {/* 獲得方法 */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">ポイントの獲得方法</h2>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          {[
            { action: "新規登録ボーナス", pt: "+10pt", note: "1回限り" },
            { action: "アプリにいいねする", pt: "+1pt", note: "押すたびに" },
            { action: "アプリがいいねされる", pt: "+1pt", note: "されるたびに" },
            { action: "テスターに承認される", pt: "+1〜5pt", note: "アプリごとに設定された値" },
            { action: "コメントに開発者から報酬をもらう", pt: "+1〜3pt", note: "開発者が任意で付与" },
            { action: "Xでアプリをシェアする", pt: "+2pt", note: "1アプリにつき1回" },
          ].map((row, i, arr) => (
            <div key={row.action} className={`flex items-center justify-between px-5 py-4 gap-4 ${i !== arr.length - 1 ? "border-b border-zinc-100 dark:border-zinc-800" : ""}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{row.action}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{row.note}</p>
              </div>
              <span className="text-sm font-bold text-green-600 dark:text-green-400 flex-shrink-0">{row.pt}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 消費方法 */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">ポイントの使い道</h2>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          {[
            { action: "アプリをブーストする", pt: "50pt", note: "3日間、一覧の上位に表示される" },
          ].map((row, i, arr) => (
            <div key={row.action} className={`flex items-center justify-between px-5 py-4 gap-4 ${i !== arr.length - 1 ? "border-b border-zinc-100 dark:border-zinc-800" : ""}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{row.action}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{row.note}</p>
              </div>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400 flex-shrink-0">{row.pt}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 注意事項 */}
      <section className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
        <h2 className="font-bold mb-2 text-sm">注意事項</h2>
        <ul className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
          <li>ポイントに金銭的な価値はありません。</li>
          <li>テスター承認時に付与されるポイントはApp Atelier運営から付与されるものであり、開発者個人が付与するものではありません。</li>
          <li>ポイントの制度・内容は今後変更される場合があります。</li>
        </ul>
      </section>
    </div>
  );
}
