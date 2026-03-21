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
- **アップデート投稿:** 開発者がバージョン/タイトル/内容を投稿・削除
- **Xシェア:** +10pt（1アプリ1回限り）
- **リンクシェア:** クリップボードコピー / Web Share API
- **スクリーンショット:** サムネイル選択・ライトボックス拡大
- **YouTube動画:** 埋め込み表示

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

### `/profile` マイページ
- **実装:** `app/profile/page.tsx`（要ログイン）
- アバター画像変更（Supabase Storage）
- ユーザー名変更（7日に1回制限）
- 自己紹介・SNSリンク編集（X / GitHub / Website）
- メールアドレス変更（確認メール送信）
- バッジ表示（PLATINUM等）、DevBadge、TesterBadge
- ポイント残高表示（aa_pointsの合計）
- テーマ切替（ライト/ダーク）
- 投稿アプリ一覧: 見る / 編集 / ブーストボタン / 削除
- アカウント削除（お問い合わせ案内のみ）

### `/users/[username]` 公開プロフィール
- **実装:** `app/users/[username]/page.tsx`
- プロフィール情報・バッジ・SNSリンク表示
- 投稿アプリ一覧（アイコン・名前・タグ・いいね数）
- DevBadge（投稿数）・TesterBadge（テスター承認数+高評価コメント数）

### `/auth` 認証
- **実装:** `app/auth/page.tsx`
- メール/パスワードでログイン・新規登録
- `/auth/callback` OAuthコールバック
- `/auth/update-password` パスワード更新

### 説明系ページ（静的）
- `/platinum` PLATINUMバッジ説明（ログイン状態で出し分け）
- `/testers` テスター制度説明
- `/points` ポイント制度説明
- `/badges` バッジ一覧説明
- `/resources` About（サービス説明）
- `/privacy` プライバシーポリシー
- `/terms` 利用規約
- `/contact` お問い合わせ

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

---

## 未実装・今後のTODO
- ヘッダーのモバイル対応（マイページ・マイアプリへのリンク不足）
- iOS App Store申請
- Google Play本番申請
- マネタイズ（ポイント購入導線、月額サブスク、スポンサー枠）
- 離脱防止（通知、週次ランキング、フォロー機能）
- バッジ自動付与ロジック（GOLD/SILVER/BRONZE）

---

## モバイルアプリ設計（実装予定）

パス: `C:\dev\app-atelier-app`（Expo / React Native）

### ボトムナビ（5タブ）
- ホーム / ゲーム / App / Web / 検索

### ホームタブ
- **フォローあり時:** フォロー中の新着アプリ・アップデート情報 → ブースト中アプリ → おすすめ
- **フォローなし時:** ブースト中アプリ → 新着 → 閲覧履歴ベースのおすすめ

### ゲーム・App・Webタブ
- 各カテゴリのアプリ一覧（タグで絞り込み済み）

### 検索タブ
- キーワード・タグ検索

### プロフィール画面
- 自分の情報・ポイント残高・バッジ
- **開発者メニュー（プロフィール内）:** アプリ投稿・編集・テスター管理・アップデート投稿

### テーマ
- 初回起動時に白/黒を選択、設定画面からいつでも変更可能

### 必要な新テーブル
- `aa_follows`（フォロー機能・別ターミナルで実装中）
- `aa_view_history`（閲覧履歴→おすすめ計算用）

---

## スケーリング対策（将来・未実装）
- SSRキャッシュ: `export const revalidate = 60`（現在force-dynamic）
- Supabase Read Replica追加（Pro以上必要・契約済み）
