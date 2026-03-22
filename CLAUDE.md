@AGENTS.md

# App Atelier プロジェクト情報

## 概要
- **サービス名:** App Atelier
- **URL:** https://app-atelier.vercel.app
- **コンセプト:** 個人開発者がアプリを投稿・発信・応援できる日本語特化コミュニティ（Product Huntの個人開発者版）
- **オーナー:** 佐藤涼（ハンドル: pikkaw2 / App Atelierユーザー名: app_atelier / バッジ: master）

## インフラ
- **フロントエンド:** Next.js App Router → Vercel Pro ($20/月)
- **DB/Auth:** Supabase Pro + Micro compute（プロジェクト名: mimamorinote）
- **モバイル:** Expo/React Native（パス: C:\dev\app-atelier-app）
- **ストレージ:** Supabase Storage バケット `aa-apps`

## 作業ルール
- コード修正完了後は確認なしで `git add → commit → push` まで自動で行う
- pushするとVercelが自動デプロイする

---

## ページ一覧と実装済み機能

### `/` ホーム（SSR）
- **実装:** `app/page.tsx`（Server Component）→ `components/HomeClient.tsx`（Client Component）
- `export const dynamic = "force-dynamic"` + 5秒タイムアウト
- SSRで初期データを取得し、HomeClientにpropsで渡す（`initialApps`）
- **注目アプリセクション:** ブースト済みアプリを横スクロールで表示（`isBoosted: true`のもの、「すべて」タブのみ）
- **今月の人気TOP3:** 直近30日のアプリをlikes_count降順で3件表示（「すべて」タブのみ）
- **最近アップデートセクション:** 直近7日でaa_app_updatesに投稿があったアプリを横スクロール表示（「すべて」タブのみ）
- **タブ:** すべて / 🧪テスター募集 / マイアプリ（ログイン時のみ）
- **ソート:** 新着（created_at）/ 人気（likes_count）
- **フィルター:** プラットフォームタグ / カテゴリタグ（ドロップダウン複数選択）
- **検索:** アプリ名・説明文のあいまい検索
- **ページネーション:** 10件/ページ、前へ/次へ
- **マイアプリタブ:** ブーストボタン付きカード（50pt・3日間）
- **ソート優先順位:** ブースト中 > PLATINUMバッジ > 通常

### `/apps/[id]` アプリ詳細
- **実装:** `app/apps/[id]/page.tsx`（Client Component）
- アプリ情報・開発者情報表示（別クエリで取得）
- **いいね:** トグル式、いいねした人+1pt・された開発者+1pt
- **コメント:** 投稿・削除（自分のみ）、開発者がコメントに1〜3pt付与可能
- **テスター申請:** 申請フォーム（メッセージ任意）、申請済み/承認済み/見送り表示
- **ブースト:** 50pt消費・3日間（オーナーのみ表示、アクションボタン列に配置）
- **アップデート投稿:** 開発者がバージョン/タイトル/内容を投稿・削除、投稿で+5pt
- **Xシェア:** +10pt（1アプリ1回限り・自分のアプリはpt付与なし）
- **リンクシェア:** クリップボードコピー / Web Share API
- **スクリーンショット:** サムネイル選択・ライトボックス拡大
- **通報機能:** 🚩通報ボタン（オーナー以外に表示）→ aa_reportsへinsert、理由テキスト必須
- **コメントレート制限:** 1分以内に複数コメント不可
- **is_hidden対応:** `is_hidden=true`のアプリはfetchで弾きトップへリダイレクト
- **YouTube動画:** 埋め込み表示
- **関連アプリ:** ページ下部に同タグのアプリを最大4件表示（likes_count降順）

### `/apps/[id]/edit` アプリ編集
- **実装:** `app/apps/[id]/edit/page.tsx`
- 投稿と同じフォームで全項目編集可能
- オーナーのみアクセス可

### `/apps/[id]/testers` テスター管理
- **実装:** `app/apps/[id]/testers/page.tsx`
- 申請一覧（pending/approved/rejected）
- 承認・拒否操作、承認時にポイント自動付与

### `/submit` アプリ投稿
- **実装:** `app/submit/page.tsx`（要ログイン）
- アイコン画像アップロード（Supabase Storage）
- スクリーンショット最大5枚（PLATINUMバッジは10枚）
- 各種URL: App Store / Google Play / Web / GitHub / X / YouTube
- タグ: プラットフォーム・カテゴリ・スペシャル（複数選択）
- ステータス: リリース済み / ベータ版 / 開発中
- テスター募集: スロット数・報酬ポイント設定
- **誓約チェックボックス:** 「規約に同意します」チェックなしは送信不可
- **投稿数上限:** 1ユーザー最大20件（超過でエラー表示）
- **新規アカウント制限:** 登録24h以内は1日1件まで（gold/platinum/masterバッジは免除）
- **投稿完了後:** 🎉完了画面を表示（router.pushではなくsetSubmittedApp）
  - Xシェアボタン（テキスト＋URL付き）
  - 「アプリページを見る」リンク
  - 「ホームへ戻る」ボタン

### `/profile` マイページ
- **実装:** `app/profile/page.tsx`（要ログイン）
- アバター画像変更（Supabase Storage）
- ユーザー名変更（7日に1回制限）
- 自己紹介・SNSリンク編集（X / GitHub / Website）
- メールアドレス変更（確認メール送信）
- バッジ表示（PLATINUM等）、DevBadge、TesterBadge
- ポイント残高表示（aa_pointsの合計）
- フォロワー数・フォロー中数表示
- フォロワー/フォロー中リスト（タブ切り替え、ユーザーページへのリンク付き）
- **会員登録数表示:** masterバッジ（オーナー）のみ表示（👥 〇〇 人）
- テーマ切替（ライト/ダーク）
- 投稿アプリ一覧: 見る / 編集 / ブーストボタン / 削除（モバイル対応：ボタンを2行目に分離）
- アカウント削除（お問い合わせ案内のみ）

### `/users/[username]` 公開プロフィール
- **実装:** `app/users/[username]/page.tsx`
- プロフィール情報・バッジ・SNSリンク表示
- フォロワー数・フォロー中数表示
- フォロワー/フォロー中リスト（フォロー数>0の場合のみ表示、タブ切り替え）
- フォローボタン（ログイン済みかつ他ユーザーのページのみ表示）
- 投稿アプリ一覧（アイコン・名前・タグ・いいね数）
- DevBadge（投稿数）・TesterBadge（テスター承認数+高評価コメント数）

### `/auth` 認証
- **実装:** `app/auth/page.tsx`
- メール/パスワードでログイン・新規登録
- `/auth/callback` OAuthコールバック
- `/auth/update-password` パスワード更新

### `/admin` 通報管理（master専用）
- **実装:** `app/admin/page.tsx`
- masterバッジ以外はトップへリダイレクト
- aa_reportsをfetch→アプリ名・通報者名をjoinして表示
- フィルター: 未対応 / 対応済み
- 3件以上通報のアプリに⚠バッジ表示
- 「対応済みにする」「アプリを削除」操作
- マイページの会員登録数表示横に「🚩 通報管理」リンクあり

### 説明系ページ（静的）
- `/platinum` PLATINUMバッジ説明（ログイン状態で出し分け・付与終了済み表示）
- `/testers` テスター制度説明
- `/points` ポイント制度説明
- `/badges` バッジ一覧説明（PLATINUMは「付与終了」表示）
- `/resources` About（サービス説明・バッジ制度は `/badges` にリンク）
- `/privacy` プライバシーポリシー（通知目的・第三者提供条件・セキュリティ追記済み）
- `/terms` 利用規約（15条構成・定型約款・反社排除・損害賠償上限・外部リンク免責・知的財産権）
- `/contact` お問い合わせ（ドメイン取得後にURL更新が必要）

---

## Supabaseテーブル構造（aa_プレフィックス）

### aa_profiles
- id, username, bio, avatar_url
- twitter_url, github_url, website_url
- badge (master/platinum/gold/silver/bronze)
- username_updated_at, created_at

### aa_apps
- id, user_id, name, tagline, description
- icon_url, screenshot_urls (ARRAY)
- url, app_store_url, play_store_url, github_url, twitter_url, youtube_url
- tags (ARRAY), status (released/beta/dev)
- tester_slots, tester_reward_points, likes_count
- created_at

### aa_likes
- id, user_id, app_id, created_at

### aa_comments
- id, user_id, app_id, content, created_at

### aa_points（ポイント履歴）
- id, user_id, amount（負の値で消費）, reason, app_id, created_at

### aa_tester_applications
- id, app_id, user_id, message, status(pending/approved/rejected), created_at

### aa_app_updates
- id, app_id, user_id, version, title, content, created_at

### aa_boosts
- id, app_id, user_id, expires_at, created_at
- ※typeカラムあるがCHECK制約削除済み・insertで送らない

### aa_reports（通報）
- id, app_id, user_id（reporter_id）, reason（text）, status（pending/resolved）, created_at
- RLS: INSERT=authenticated / SELECT・UPDATE=masterのみ（SECURITY DEFINER RPC想定）
- 3件以上通報されるとDBトリガーでaa_apps.is_hiddenがtrueになる
- aa_apps: is_hiddenカラム（boolean, default false）

### aa_follows（フォロー）
- id, follower_id (uuid → auth.users), following_id (uuid → auth.users), created_at
- UNIQUE(follower_id, following_id)
- RLS: SELECT=全員可 / INSERT=authenticated(follower_id=自分) / DELETE=authenticated(follower_id=自分)

---

## RPC関数

### get_home_apps(p_sort, p_tab, p_user_id, p_search)
- RETURNS json / SECURITY DEFINER / GRANT TO anon 済み
- is_boosted(boolean)・username・badge を含む全アプリ取得（最大100件）
- ORDER BY: is_boosted DESC → likes_count/created_at DESC
- WHERE: tab/user_id/search条件でフィルター

---

## ポイント制度

| 行動 | pt |
|------|-----|
| 新規登録ボーナス | +10pt（1回） |
| いいねする | +1pt |
| いいねされる | +1pt |
| テスター承認 | +1〜5pt（アプリごと設定） |
| コメント報酬 | +1〜3pt（開発者が付与） |
| Xシェア | +10pt（1アプリ1回） |
| アップデート投稿 | +5pt |
| ブースト | -50pt（3日間） |

---

## バッジ制度
- **PLATINUM:** 先着150名→全登録ユーザーに一括付与済み（224名）
- **MASTER:** 手動付与（現在オーナーのみ）
- **GOLD / SILVER / BRONZE:** 未実装（手動付与のみ）
- 新規登録トリガー `assign_signup_badge` はSupabase DB Functionに存在

---

## OGP画像設定

### トップページ（`/`）
- **実装:** `app/opengraph-image.tsx`
- 紫グラデーション背景＋🎨アイコン＋"App Atelier"テキスト
- サイズ: 1200×630px、edge runtime

### アプリ詳細ページ（`/apps/[id]`）
- **実装:** `app/apps/[id]/opengraph-image.tsx`
- Supabaseからアプリの`icon_url`・`name`・`tagline`を取得して表示
- **注意:** edge runtimeでは`Buffer`が使えないため、画像は`fetch`→`ArrayBuffer`→`btoa`ループでbase64変換すること（spreadは大きい画像でスタックオーバーフローするのでNG）
- **レイアウト:** 左630×630パネル（アイコン380×380、背景#18181b）＋右パネル（"App Atelier"ラベル・アプリ名・タグライン）
- **やらかし記録（2026-03-21）:**
  1. 最初に`Buffer.from(buf).toString("base64")`を使ったがedge runtimeで動かなかった
  2. `btoa(String.fromCharCode(...new Uint8Array(buf)))`のspread版も大きい画像でNG
  3. 正解: `for`ループで1文字ずつ`String.fromCharCode`して`btoa`に渡す
  4. **Next.js 16のparams非同期問題:** `params.id`を直接使うとPromiseオブジェクトがSupabaseに渡りnullが返る→フォールバック表示になる。必ず`{ params }: { params: Promise<{ id: string }> }`にして`const { id } = await params`とすること
  5. **JSXコメントで黒画面:** `{/* コメント */}`をImageResponse内に書くと黒画面になる。next/og内ではJSXコメント禁止

---

## App Store審査対策

### 落ちるパターンと対策

#### ① 「ウェブの薄いラッパー」判定（Guideline 4.2）
- プッシュ通知実装（Expo Notifications）→ いいね・コメント・テスター承認時に通知（最重要）
- アプリ内でコメント・いいね・テスター申請が完結することをメタデータで明示
- ホーム画面ウィジェット（今週の注目アプリ表示）

#### ② 「未審査コンテンツの入口」判定（Guideline 1.1 / 5.1）
- 通報機能・管理画面は実装済み → 審査申請メモ欄でモデレーション体制を説明する
- ユーザーブロック機能を追加（aa_blocksテーブル）
- モバイルアプリの設定画面に利用規約・プライバシーポリシーへのリンクを追加

#### ③ メタデータ・スクリーンショット不備（Guideline 2.1）
- スクリーンショットはコミュニティ機能（コメント・テスター申請・ポイント）を中心に
- 説明文に「掲載アプリは審査済みではない・利用は自己責任」と明記
- キーワードは「個人開発」「コミュニティ」中心

### 実装TODO（優先順）
1. **プッシュ通知**（Expo Notifications + Supabase Edge Functions）← 審査通過＆定着に直結
2. **設定画面に規約・プライバシーリンク追加**（モバイルアプリ）← 簡単・必須
3. **審査申請メモ欄の文言準備**（コード不要・申請時に記載）
4. **ユーザーブロック機能**（aa_blocksテーブル + UI）
5. **ホーム画面ウィジェット**（Expo Widget / iOS限定・複雑）

---

## 未実装・今後のTODO
- **メール通知:** いいね・コメント・テスター承認時にSupabase Edge Functions + Resendで送信（月3,000通無料）
- **X自動ツイート:** Vercel Cron + X API v2（Developer申請フラグ待ち）
- **独自ドメイン取得:** 4月予定（Vercelで購入予定）
- **【App Store審査対策①】プッシュ通知実装:** Expo Notifications + Supabase Edge Functions（いいね・コメント・テスター承認時）
- **【App Store審査対策③】審査申請メモ欄の文言準備:** コード不要・申請時にモデレーション体制を説明する文章を用意する
- **【App Store審査対策④】ユーザーブロック機能:** aa_blocksテーブル追加 + ブロックしたユーザーのコンテンツ非表示UI
- iOS App Store申請
- Google Play本番申請
- マネタイズ（ポイント購入導線、月額サブスク、スポンサー枠）
- バッジ自動付与ロジック（GOLD/SILVER/BRONZE）

---

## モバイルアプリ（実装済み）

パス: `C:\dev\app-atelier-app`（Expo SDK 54 / React Native）

### ボトムナビ（5タブ）実装済み
- **ホーム** (`index.tsx`): 注目アプリ（ブースト中・横スクロール）+ 新着 + 人気
- **ゲーム** (`game.tsx`): "ゲーム"タグフィルター済みランキング
- **App** (`applist.tsx`): iOS/Android/Mac/Windows/クロスプラットフォームをタブ切り替え
- **Web** (`weblist.tsx`): "Web"タグフィルター済みランキング
- **検索** (`search.tsx`): キーワード検索 + カテゴリチップ絞り込み（300msデバウンス）

### ヘッダー
- 左: 👤アイコン → マイページへ遷移
- 右: テーマ切替ボタン

### マイページ・投稿
- タブバーには非表示、ヘッダー👤から遷移
- masterバッジのオーナーのみ会員登録数表示

### 共通コンポーネント
- `components/FilteredAppList.tsx`: タグフィルター付きリスト（ゲーム/App/Web共通）

---

## モバイル対応（web版）
- `html, body { overflow-x: hidden; max-width: 100vw; }` でスクロール防止
- `viewport: { userScalable: false }` でズーム防止
- `input, textarea, select { font-size: 16px; }` でiOSズーム防止
- ヘッダー: モバイルでは「投稿」短縮・「マイページ」→アバター画像アイコン・「ログアウト」非表示
- ヘッダーアバター: aa_profilesからavatar_urlを取得して表示（未設定なら👤）

---

## スケーリング対策（将来・未実装）
- SSRキャッシュ: `export const revalidate = 60`（現在force-dynamic）
- Supabase Read Replica追加（Pro以上必要・契約済み）
