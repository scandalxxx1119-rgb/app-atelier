export const metadata = {
  title: 'プライバシーポリシー | おかいものノート',
  description: 'おかいものノートのプライバシーポリシーです。',
};

export default function KaimonoNotePrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-1">プライバシーポリシー</h1>
      <p className="text-sm text-zinc-400 mb-2">おかいものノート</p>
      <p className="text-sm text-zinc-400 mb-10">最終更新日：2026年4月1日</p>

      <div className="space-y-8 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">1. はじめに</h2>
          <p>
            App Atelier（以下「当社」）は、おかいものノート（以下「本アプリ」）において取り扱う情報について、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。本アプリをご利用になる前に、必ず本ポリシーをお読みください。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">2. 収集する情報</h2>
          <p>本アプリは以下の情報を収集・保存します。</p>
          <p className="font-semibold mt-3 text-zinc-800 dark:text-zinc-200">【ユーザーが入力する情報】</p>
          <ul className="list-disc list-inside mt-1 space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>冷蔵庫の食材情報（品名・数量・カテゴリ・消費期限）</li>
            <li>買い物リストの商品情報（品名・数量・カテゴリ）</li>
            <li>料理メモ（料理名・メモ・曜日）</li>
            <li>食費の支出記録（金額・内容・日付）</li>
            <li>月の食費予算額</li>
          </ul>
          <p className="font-semibold mt-3 text-zinc-800 dark:text-zinc-200">【自動的に生成される情報】</p>
          <ul className="list-disc list-inside mt-1 space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>端末識別子（UUID）：アプリ初回起動時に端末上でランダム生成される匿名の識別子です。氏名・メールアドレス・電話番号・位置情報など、個人を直接特定できる情報は含まれません。</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">3. 情報の利用目的</h2>
          <p>収集した情報は、以下の目的のみに使用します。</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>本アプリの機能（冷蔵庫管理・買い物リスト・料理メモ・家計簿）の提供</li>
            <li>複数回の起動にわたってデータを保持すること</li>
          </ul>
          <p className="mt-2">
            収集した情報を、広告目的・マーケティング目的・第三者への販売目的で使用することはありません。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">4. 情報の共有・第三者提供</h2>
          <p>
            当社は、以下の場合を除き、ユーザーの情報を第三者に提供しません。
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>法令に基づく場合</li>
            <li>人の生命・身体・財産の保護のために必要な場合</li>
          </ul>
          <p className="font-semibold mt-3 text-zinc-800 dark:text-zinc-200">【利用するサービスプロバイダー】</p>
          <ul className="list-disc list-inside mt-1 space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>
              Supabase, Inc.（米国）：アプリデータのクラウドデータベースとして利用しています。データ処理の委託先であり、独自の目的でデータを利用することはありません。（
              <a
                href="https://supabase.com/privacy"
                className="underline text-zinc-500"
                target="_blank"
                rel="noopener noreferrer"
              >
                Supabase プライバシーポリシー
              </a>
              ）
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">5. データの保管場所とセキュリティ</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>端末識別子（UUID）および設定情報は、お使いの端末内のストレージに保存されます。</li>
            <li>食材・買い物・料理・家計データは Supabase のサーバー（米国）に保存されます。</li>
            <li>通信はすべて HTTPS（TLS）で暗号化されています。</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">6. データの削除</h2>
          <p className="font-semibold text-zinc-800 dark:text-zinc-200">【端末データの削除】</p>
          <p className="mt-1">
            アプリをアンインストールすることで、端末に保存されたすべての情報（UUID・設定等）が削除されます。
          </p>
          <p className="font-semibold mt-3 text-zinc-800 dark:text-zinc-200">【サーバーデータの削除】</p>
          <p className="mt-1">
            サーバーに保存されたデータの削除をご希望の場合は、下記のお問い合わせ先までご連絡ください。端末識別子（UUID）をお知らせいただければ、対応するすべてのデータを削除します。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">7. 子どものプライバシー</h2>
          <p>
            本アプリは13歳未満の子どもを対象としておらず、意図して13歳未満の子どもから個人情報を収集することはありません。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">8. 本ポリシーの変更</h2>
          <p>
            本ポリシーは必要に応じて改定することがあります。重要な変更がある場合はアプリのアップデートを通じてお知らせします。最新のポリシーは常にこのページおよびアプリ内の設定画面でご確認いただけます。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">9. お問い合わせ</h2>
          <p>
            本ポリシーに関するご質問・データ削除のご依頼は、以下のメールアドレスまでお問い合わせください。
          </p>
          <p className="mt-2 font-medium text-zinc-800 dark:text-zinc-200">
            App Atelier<br />
            メール：dtnhj4mx27@privaterelay.appleid.com
          </p>
        </section>

      </div>
    </div>
  );
}
