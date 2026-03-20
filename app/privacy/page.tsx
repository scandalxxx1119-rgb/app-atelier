export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">プライバシーポリシー</h1>
      <p className="text-sm text-zinc-400 mb-10">最終更新日：2026年3月21日</p>

      <div className="space-y-8 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">1. 事業者情報</h2>
          <p>
            本サービス「App Atelier」（以下「本サービス」）は、個人が運営するサービスです。
            運営者情報については<a href="/contact" className="underline text-zinc-500">運営者情報ページ</a>をご確認ください。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">2. 取得する情報</h2>
          <p>本サービスでは、以下の情報を取得します。</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>メールアドレス（アカウント登録時）</li>
            <li>ユーザー名・プロフィール情報（ユーザーが任意で入力した情報）</li>
            <li>投稿したアプリ情報・コメント・いいね等の利用履歴</li>
            <li>アクセスログ（IPアドレス・ブラウザ情報等）</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">3. 利用目的</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>本サービスの提供・運営・改善</li>
            <li>ユーザー認証・アカウント管理</li>
            <li>お問い合わせへの対応</li>
            <li>不正利用の防止</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">4. 第三者提供</h2>
          <p>
            取得した個人情報は、法令に基づく場合を除き、本人の同意なく第三者に提供しません。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">5. 委託先・利用サービス</h2>
          <p>本サービスは以下の外部サービスを利用しています。各サービスのプライバシーポリシーをご確認ください。</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>Supabase（認証・データベース）</li>
            <li>Vercel（ホスティング）</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">6. Cookieについて</h2>
          <p>
            本サービスはログイン状態の維持のためにCookieおよびローカルストレージを使用します。
            ブラウザの設定によりCookieを無効にすることができますが、一部機能が利用できなくなる場合があります。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">7. 個人情報の開示・訂正・削除</h2>
          <p>
            ご自身の個人情報の開示・訂正・削除をご希望の場合は、<a href="/contact" className="underline text-zinc-500">お問い合わせ先</a>までご連絡ください。
            本人確認の上、合理的な期間内に対応します。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">8. セキュリティ</h2>
          <p>
            個人情報の漏えい・滅失・き損の防止のため、適切な安全管理措置を講じます。
            ただし、インターネット上の通信は完全な安全性を保証するものではありません。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">9. ポリシーの変更</h2>
          <p>
            本ポリシーは必要に応じて変更することがあります。変更後はこのページに掲載します。
            重要な変更がある場合はサービス内でお知らせします。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">10. お問い合わせ</h2>
          <p>
            個人情報の取り扱いに関するお問い合わせは<a href="/contact" className="underline text-zinc-500">こちら</a>からご連絡ください。
          </p>
        </section>

      </div>
    </div>
  );
}
