export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">利用規約</h1>
      <p className="text-sm text-zinc-400 mb-10">最終更新日：2026年3月21日</p>

      <div className="space-y-8 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">1. はじめに</h2>
          <p>
            本利用規約（以下「本規約」）は、App Atelier（以下「本サービス」）の利用条件を定めるものです。
            ユーザーは本規約に同意した上で本サービスをご利用ください。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">2. アカウント</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>登録は実在するメールアドレスで行ってください</li>
            <li>アカウントの管理はご自身の責任で行ってください</li>
            <li>1人1アカウントを原則とします</li>
            <li>未成年の方は保護者の同意を得た上でご利用ください</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">3. 禁止事項</h2>
          <p>以下の行為を禁止します。</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>他者の権利（著作権・商標権等）を侵害するコンテンツの投稿</li>
            <li>虚偽・誇大な情報の投稿</li>
            <li>スパム・広告目的の投稿</li>
            <li>他のユーザーへの嫌がらせ・誹謗中傷</li>
            <li>違法・有害なコンテンツの投稿</li>
            <li>本サービスのシステムへの不正アクセス・攻撃</li>
            <li>複数アカウントを用いた不正行為</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">4. 投稿コンテンツ</h2>
          <p>
            ユーザーが投稿したコンテンツの著作権はユーザーに帰属します。
            ただし、本サービスの運営・改善・プロモーションのために必要な範囲で利用することを許諾するものとします。
            投稿内容が本規約に違反する場合、予告なく削除することがあります。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">5. 無料プランについて</h2>
          <p>
            現在提供している無料プランは、サービスの普及を目的とした特典です。
            将来的に有料プランを導入する場合、既存ユーザーには事前に告知します。
            なお、サービスの内容・仕様は予告なく変更される場合があります。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">6. 免責事項</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>本サービスは現状有姿で提供します。動作の完全性・継続性を保証しません</li>
            <li>ユーザー間のトラブルについて、運営者は責任を負いません</li>
            <li>投稿されたアプリ・コンテンツの正確性・安全性について保証しません</li>
            <li>本サービスの利用により生じた損害について、運営者の故意・重過失による場合を除き責任を負いません</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">7. サービスの変更・停止</h2>
          <p>
            運営者は、ユーザーへの事前通知なくサービスの内容を変更・停止・終了することがあります。
            これによりユーザーに生じた損害について責任を負いません。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">8. アカウント停止</h2>
          <p>
            本規約に違反した場合、予告なくアカウントを停止・削除することがあります。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">9. 準拠法・管轄</h2>
          <p>
            本規約は日本法に準拠します。本サービスに関する紛争については、運営者の所在地を管轄する裁判所を合意管轄とします。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">10. お問い合わせ</h2>
          <p>
            本規約に関するお問い合わせは<a href="/contact" className="underline text-zinc-500">こちら</a>からご連絡ください。
          </p>
        </section>

      </div>
    </div>
  );
}
