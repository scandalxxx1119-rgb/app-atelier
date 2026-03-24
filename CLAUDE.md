@AGENTS.md

# App Atelier プロジェクト情報

## 概要
- **サービス名:** App Atelier
- **URL:** https://appatelier.dev（旧: app-atelier.vercel.app）
- **コンセプト:** 個人開発者がアプリを投稿・発信・応援できる日本語特化コミュニティ（Product Huntの個人開発者版）
- **オーナー:** 佐藤涼（ハンドル: pikkaw2 / App Atelierユーザー名: app_atelier / バッジ: master）

## インフラ
- **フロントエンド:** Next.js App Router → Vercel Pro ($20/月)
- **DB/Auth:** Supabase Pro + Micro compute（プロジェクト名: mimamorinote）
- **モバイル:** Expo/React Native（パス: C:\dev\app-atelier-app）
- **ストレージ:** Supabase Storage バケット `aa-apps`

## 作業ルール
- **pushはユーザーから明示的に指示があるまで行わない**
- 編集完了後は `git add → commit` までにとどめ、pushはしない
- 複数ターミナルで作業している場合、全員の作業が揃ってから1回まとめてpushする（Vercelのビルドコスト削減のため）
- ユーザーが「pushして」と言ったときだけ `git push` を実行する
- pushするとVercelが自動デプロイする（ビルド1回 = 約$2〜3消費）

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
- **3段階オンボーディングガイド:** 全完了で次のステップに切り替わる（4ステップ以降は随時追加予定）
  - ステップ1（紫）: アバター・いいね・テスター申請・アプリ投稿
  - ステップ2（青）: アップデート投稿・フォロー・Xシェア・コメント
  - ステップ3（黄）: ブースト・テスター承認・コメント報酬付与・2本目投稿
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

### `/board` 意見掲示板
- **実装:** `app/board/page.tsx`（スレッド一覧）、`app/board/[postId]/page.tsx`（スレッド詳細）
- 「こんなアプリが欲しい」スレッドを立てられる
- 開発者がレスできる（返信フォーム）
- 自分の投稿・返信のみ削除可
- テーブル: `aa_board_posts`（title/content）、`aa_board_replies`（post_id/content）
- ヘッダーに「掲示板」リンク追加

### ログインボーナス
- **実装:** `components/LoginBonus.tsx` → `components/Providers.tsx` に組み込み
- 毎日初回アクセス時に10pt付与（`check_login_bonus` RPC）
- 連続ログイン日数を記録（`aa_login_streaks` テーブル）
- マイルストーンボーナス: 3/5/10/30/50/100日→+30pt、以降50日おきに+30pt
- 特別ボーナス: 365/730/1095日→+300pt
- ログイン時に画面下部にトースト通知表示

---

## Google Play データセーフティ回答（App Atelier）

### ステップ2: データの収集とセキュリティ
- ユーザーデータを収集または共有する？ → **はい**
- 転送時に暗号化されるか？ → **はい**
- アカウント作成方法 → **ユーザー名とパスワード**のみチェック
- アカウント削除用URL → `https://appatelier.dev/contact`
- 一部データのみの削除リクエスト方法を提供するか？（任意） → **いいえ**

### ステップ3: データの種類
- メールアドレス：収集あり（Supabase認証）
- ユーザーID・ユーザー名：収集あり

### ステップ4: データの使用と処理
- アカウント管理目的のみ

---

## 未pushの変更（push待ち）

### プッシュ通知 + ブロック機能（2026-03-24）

#### web (app-atelier)
- `supabase/functions/send-push/index.ts`: 新規作成。Expo Push APIを呼び出すEdge Function。`aa_push_tokens`からトークン取得 → Expoに送信
- `app/apps/[id]/page.tsx`: いいね時・コメント時にオーナーへプッシュ通知を送信（`supabase.functions.invoke("send-push")`）
- `app/apps/[id]/testers/page.tsx`: テスター承認/見送り時に申請者へプッシュ通知を送信

#### mobile (app-atelier-app)
- `app/users/[username].tsx`: ブロック/ブロック解除ボタンを追加（`aa_blocks`テーブルへinsert/delete）
- `app/apps/[id]/index.tsx`: ブロックしたユーザーのコメントを非表示にする（`aa_blocks`から取得してフィルター）

#### Supabase側で必要な作業（未対応）
```sql
-- aa_push_tokensテーブルはモバイルの_layoutで既に参照済み（要作成）
create table aa_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  token text not null,
  created_at timestamptz default now(),
  unique(user_id, token)
);
alter table aa_push_tokens enable row level security;
create policy "own tokens" on aa_push_tokens for all using (auth.uid() = user_id);

-- aa_blocksテーブル
create table aa_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid references auth.users not null,
  blocked_id uuid references auth.users not null,
  created_at timestamptz default now(),
  unique(blocker_id, blocked_id)
);
alter table aa_blocks enable row level security;
create policy "own blocks" on aa_blocks for all using (auth.uid() = blocker_id);
```
- Edge Functionのデプロイ: `supabase functions deploy send-push`

---

## 未実装・今後のTODO
- **メール通知:** いいね・コメント・テスター承認時にSupabase Edge Functions + Resendで送信（月3,000通無料）
- **X自動ツイート:** 実装済み・Vercel Cron設定済み。X_ACCESS_SECRETのタイポ（X_ACCESS_SECRE）を修正済み（2026-03-23）
- **独自ドメイン:** `appatelier.dev` 取得・設定済み（2026-03-23）。ICANNメール認証が必要（未完了の場合は要確認）
- **【App Store審査対策①】プッシュ通知実装:** Expo Notifications + Supabase Edge Functions（いいね・コメント・テスター承認時）
- **【App Store審査対策③】審査申請メモ欄の文言準備:** コード不要・申請時にモデレーション体制を説明する文章を用意する
- **【App Store審査対策④】ユーザーブロック機能:** aa_blocksテーブル追加 + ブロックしたユーザーのコンテンツ非表示UI
- **iOS App Store審査中**（2026-03-23提出済み・最大48時間で結果メール）
  - TestFlight外部テスト: 審査通過後にテスター招待リンク発行予定
- **Google Play クローズドテスト審査中**（2026-03-23提出済み）
  - 製品版公開条件: クローズドテスト12人以上オプトイン + 14日間継続が必要
  - テスターオプトインURL: https://play.google.com/apps/testing/com.appatelier.app
  - SNSでテスター募集中（現在0人）
- マネタイズ（ポイント購入導線、月額サブスク、スポンサー枠）
- バッジ自動付与ロジック（GOLD/SILVER/BRONZE）
- **YouTubeチャンネル開設済み・TikTok・Instagram開設済み**（2026-03-23）。App Atelier紹介動画を21時に予約投稿済み

---

## モバイルアプリ（実装済み）

パス: `C:\dev\app-atelier-app`（Expo SDK 54 / React Native）

### ビルド状況（2026-03-23）
- Android AAB: `https://expo.dev/artifacts/eas/vaZu18nwHknSyJGZVFN7F7.aab`（versionCode: 2）
- iOS IPA: `https://expo.dev/artifacts/eas/jK6MXcc1YjNM2ZoDABgKa.ipa`（buildNumber: 1）
- EAS修正内容: react-native-worklets追加（reanimated v4必須）、icon.png/adaptive-icon.pngをJPEGからPNG変換

### ボトムナビ（7タブ）実装済み
- **ホーム** (`index.tsx`): 注目アプリ（ブースト中・横スクロール）+ 新着 + 人気
- **ゲーム** (`game.tsx`): "ゲーム"タグフィルター済みランキング
- **App** (`applist.tsx`): iOS/Android/Mac/Windows/クロスプラットフォームをタブ切り替え
- **Web** (`weblist.tsx`): "Web"タグフィルター済みランキング
- **掲示板** (`board.tsx`): スレッド一覧・投稿・削除、`board/[postId].tsx` で返信
- **ランキング** (`ranking.tsx`): likes_count順・上位3位にメダル絵文字
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

## 毎日アプリ紹介台本（スケジュールトリガー）

トリガーID: `trig_01RDSxVz5kLysH3ztkP5nV7R`
スケジュール: 毎日 23:00 UTC（日本時間 8:00 AM）

### 台本生成ルール（45秒 = 約200字）

**大前提: 対象は一般ユーザー**
- 専門用語・技術用語を一切使わない（API/GAS/LLM/SDK等はNG。「自動でやってくれる仕組み」などに言い換え）
- 「このアプリを使うと自分の生活がどう変わるか」の視点で書く
- 開発者向け説明ではなく、使う人の体験・感情にフォーカス

**ショート動画リサーチ知見（2026年）**
- 視聴者の71%が最初の**3秒**で離脱を決める → フックは3秒以内に決める
- **3〜5秒ごとにテンポ・視点を変える**（パターンインタラプト）と視聴維持率が上がる
- 興奮・驚き・共感などの高揚感のある感情を入れると2倍シェアされやすい
- 小学生でもわかる言葉（シンプル）な動画は2倍再生される
- 最適な長さは15〜45秒（完走率を重視）

**構成**

| パート | 時間 | 内容 |
|--------|------|------|
| フック | 0〜3秒 | 「えっ？」「わかる！」を引き出す一言。質問・逆説・衝撃の事実で始める |
| 問題・共感 | 3〜15秒 | そのシーンの不満・つらさを感情に訴えて描写。視聴者が「自分のことだ」と感じる |
| アプリ登場 | 15〜30秒 | アプリ名と解決策を一言で。使った瞬間/使った後の変化を具体的に1つだけ見せる |
| 感動・驚き | 30〜40秒 | 「え、それだけじゃなくて実は〜」など予想を超える展開で感情を高める |
| 締め | 40〜45秒 | アプリ名 + 「App Atelierで調べてみて」 |

**トーン:** カジュアル・友達に話しかける口調。エネルギーは普通の会話より20%高め。

**禁止事項**
- アプリ名・「〇〇というアプリを紹介します」から始めない
- 機能の羅列（一番刺さる体験を1つだけ深く）
- 「便利です」だけで終わらせない
- 専門用語をそのまま使う
- 平坦なトーンで最初から最後まで同じテンポ

### メールで毎日届くもの（5セクション構成）

**セクション1: サムネイル用キャッチコピー5案**（逆説/感情直撃/あるある/数字具体/疑問の5パターン、各案にコメント付き）

**セクション2: 45秒台本**（顔出しなし前提・セリフのみ）

**セクション3: CapCut編集シート**（テーブル形式・顔出しなし）

| 秒数 | 映像の内容 | テロップ | CapCut操作メモ |
|------|-----------|---------|--------------|
| 0〜3s | 顔出し or テキストカード or 画面録画 | 大きめのキャッチコピー | ポップ or タイプライターアニメ |
| ... | ... | ... | ... |

- 映像の内容: 顔出しトーク / 画面録画（アプリ名+画面名）/ テキストカード を明記
- テロップ: 中央寄り配置。3〜5秒ごとに変化をつける（パターンインタラプト）
- CapCut機能名を具体的に（Beat Sync / ズームイントランジション / 字幕自動生成 等）

**セクション4: 画面録画指示**
- シーン名・録画するURL画面・動画内の挿入タイミング・必ず映すべき要素
- 1クリップ2〜5秒目安。通知バナー非表示にしてから録画。

**セクション5: 各プラットフォーム投稿セット**
- TikTok: タイトル（25文字以内）・説明文・ハッシュタグ10個
- YouTube Shorts: タイトル（60文字以内・キーワード含む）・説明文・ハッシュタグ5個
- Instagram Reels: キャプション（絵文字入り）・ハッシュタグ15個（日英混在）

---

## スケーリング対策（将来・未実装）
- SSRキャッシュ: `export const revalidate = 60`（現在force-dynamic）
- Supabase Read Replica追加（Pro以上必要・契約済み）
