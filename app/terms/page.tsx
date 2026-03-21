export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">利用規約</h1>
      <p className="text-sm text-zinc-400 mb-10">最終更新日：2026年3月21日</p>

      <div className="space-y-8 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">1. はじめに</h2>
          <p className="mb-2">
            本利用規約（以下「本規約」）は、App Atelier（以下「本サービス」）の利用条件を定めるものです。
            本規約は民法上の定型約款に該当し、本サービスを利用した時点で本規約に同意したものとみなします。
          </p>
          <p>
            本規約は予告なく変更される場合があります。変更後も本サービスを利用し続けた場合、変更後の規約に同意したものとみなします。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">2. 利用資格・アカウント</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>本サービスは13歳以上の方を対象としています。13歳未満の方はご利用いただけません</li>
            <li>18歳未満の方は保護者の同意を得た上でご利用ください</li>
            <li>登録は実在するメールアドレスで行ってください</li>
            <li>アカウントの管理・セキュリティはご自身の責任で行ってください</li>
            <li>1人1アカウントを原則とします</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">3. 禁止事項</h2>
          <p>以下の行為を禁止します。</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>他者の権利（著作権・商標権・特許権等）を侵害するコンテンツの投稿</li>
            <li>虚偽・誇大な情報の投稿</li>
            <li>スパム・広告目的の投稿</li>
            <li>他のユーザーへの嫌がらせ・誹謗中傷</li>
            <li>違法・有害なコンテンツの投稿</li>
            <li>マルウェア・ウイルス・スパイウェア等を含むアプリの投稿</li>
            <li>フィッシング・詐欺・不正請求を目的としたアプリの投稿</li>
            <li>個人情報を無断収集するアプリの投稿</li>
            <li>実在しないアプリや動作しないアプリの投稿</li>
            <li>本サービスのシステムへの不正アクセス・攻撃</li>
            <li>複数アカウントを用いた不正行為</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">4. 投稿コンテンツと審査について</h2>
          <p className="mb-2">
            ユーザーが投稿したコンテンツの著作権はユーザーに帰属します。
            ただし、本サービスの運営・改善・プロモーションのために必要な範囲で利用することを許諾するものとします。
          </p>
          <p className="mb-2">
            <strong className="text-zinc-900 dark:text-zinc-100">本サービスは投稿内容の事前審査を行いません。</strong>
            投稿されたアプリ・コンテンツの正確性・安全性・合法性はユーザー自身の責任に帰属します。
          </p>
          <p>
            投稿内容が本規約に違反すると判断した場合、または違反の通報を受けた場合、予告なくコンテンツの削除・アカウントの停止を行うことがあります。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">5. 違反の通報</h2>
          <p>
            規約違反のコンテンツを発見した場合は、<a href="/contact" className="underline text-zinc-500">お問い合わせ</a>よりご報告ください。
            運営者は通報を受けた内容を確認し、必要に応じて対応します。
            ただし、すべての通報に対して対応・回答を保証するものではありません。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">6. 無料プランについて</h2>
          <p>
            現在提供している無料プランは、サービスの普及を目的とした特典です。
            将来的に有料プランを導入する場合、既存ユーザーには事前に告知します。
            なお、サービスの内容・仕様は予告なく変更される場合があります。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">7. ポイント制度について</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>ポイントはサービス内でのみ使用できる仮想ポイントです</li>
            <li>ポイントは現金・電子マネー・その他の財物と交換することはできません</li>
            <li>ポイントの有効期限・交換レート・用途は運営者が随時変更できます</li>
            <li>アカウント削除時にポイントは消滅します</li>
            <li>不正な手段で取得したポイントは没収することがあります</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">8. 反社会的勢力の排除</h2>
          <p className="mb-2">ユーザーは、現在および将来にわたって以下のいずれにも該当しないことを表明・保証します。</p>
          <ul className="list-disc list-inside space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>暴力団・暴力団員・暴力団関係企業・総会屋・社会運動標榜ゴロ・特殊知能暴力集団その他これらに準じる者（以下「反社会的勢力」）</li>
            <li>反社会的勢力が経営を支配または実質的に関与していると認められる者</li>
            <li>反社会的勢力と資金提供その他を通じて関与している者</li>
          </ul>
          <p className="mt-2">上記に該当することが判明した場合、予告なくアカウントを停止・削除します。</p>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">9. 免責事項・損害賠償</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>本サービスは現状有姿で提供します。動作の完全性・継続性を保証しません</li>
            <li>本サービスに掲載されたアプリは運営者が審査・保証するものではありません</li>
            <li>掲載アプリの利用により生じたいかなる損害についても運営者は責任を負いません</li>
            <li>ユーザー間のトラブルについて、運営者は責任を負いません</li>
            <li>投稿されたアプリ・コンテンツの正確性・安全性・合法性について保証しません</li>
            <li>本サービスの利用により生じた損害について、運営者の故意・重過失による場合を除き責任を負いません</li>
            <li>運営者がユーザーに対して損害賠償責任を負う場合、その賠償額はユーザーが当該月に本サービスに支払った金額（無料の場合は0円）を上限とします</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">10. サービスの変更・停止</h2>
          <p>
            運営者は、ユーザーへの事前通知なくサービスの内容を変更・停止・終了することがあります。
            これによりユーザーに生じた損害について責任を負いません。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">11. アカウント停止</h2>
          <p>
            本規約に違反した場合、または違反が疑われる場合、予告なくアカウントを停止・削除することがあります。
            これによりユーザーに生じた損害について責任を負いません。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">12. 準拠法・管轄</h2>
          <p>
            本規約は日本法に準拠します。本サービスに関する紛争については、運営者の所在地を管轄する裁判所を合意管轄とします。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">13. お問い合わせ</h2>
          <p>
            本規約に関するお問い合わせは<a href="/contact" className="underline text-zinc-500">こちら</a>からご連絡ください。
          </p>
        </section>

      </div>
    </div>
  );
}
