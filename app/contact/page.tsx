export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">運営者情報・お問い合わせ</h1>
      <p className="text-sm text-zinc-400 mb-10">最終更新日：2026年3月21日</p>

      <div className="space-y-8 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-4">運営者情報</h2>
          <table className="w-full text-sm border-collapse">
            <tbody>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="py-3 pr-6 text-zinc-400 whitespace-nowrap w-32">サービス名</td>
                <td className="py-3">App Atelier</td>
              </tr>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="py-3 pr-6 text-zinc-400 whitespace-nowrap">運営者</td>
                <td className="py-3">佐藤 涼（個人運営）</td>
              </tr>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="py-3 pr-6 text-zinc-400 whitespace-nowrap">所在地</td>
                <td className="py-3">日本</td>
              </tr>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="py-3 pr-6 text-zinc-400 whitespace-nowrap">サービスURL</td>
                <td className="py-3">
                  <a href="https://appatelier.dev" className="underline text-zinc-500" target="_blank" rel="noopener noreferrer">
                    https://appatelier.dev
                  </a>
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-6 text-zinc-400 whitespace-nowrap">X (Twitter)</td>
                <td className="py-3">
                  <a href="https://x.com/app_atelier" className="underline text-zinc-500" target="_blank" rel="noopener noreferrer">
                    @app_atelier
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-3">お問い合わせ</h2>
          <p className="mb-4">
            ご意見・ご要望・不具合報告・プライバシーに関するお問い合わせは、X（Twitter）のDMにてご連絡ください。
          </p>
          <a
            href="https://x.com/app_atelier"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm hover:opacity-80 transition-opacity"
          >
            X (Twitter) でDMを送る →
          </a>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-3">ご注意</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-500 dark:text-zinc-400">
            <li>本サービスは個人が運営しており、対応に時間がかかる場合があります</li>
            <li>内容によってはご要望にお応えできない場合があります</li>
          </ul>
        </section>

      </div>
    </div>
  );
}
