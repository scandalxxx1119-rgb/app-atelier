@AGENTS.md

# App Atelier プロジェクト情報

## 概要
- **サービス名:** App Atelier
- **URL:** https://app-atelier.vercel.app
- **コンセプト:** 個人開発者がアプリを投稿・発信・応援できる日本語特化コミュニティ（Product Huntの個人開発者版）
- **オーナー:** 佐藤涼（ハンドル: pikkaw2 / App Atelierユーザー名: app_atelier / バッジ: master）

## インフラ
- **フロントエンド:** Next.js (App Router) → Vercel
- **DB/Auth:** Supabase（プロジェクト名: mimamorinote）
- **モバイル:** Expo/React Native（パス: C:\dev\app-atelier-app）

## 作業ルール
- コード修正完了後は確認なしで `git add → commit → push` まで自動で行う
- pushするとVercelが自動デプロイする

---

## Supabaseテーブル構造（aa_プレフィックス）

### aa_profiles（ユーザープロフィール）
- id, username, bio, avatar_url
- twitter_url, github_url, website_url
- badge (master/platinum/gold/silver/bronze)
- username_updated_at, created_at

### aa_apps（投稿アプリ）
- id, user_id, name, tagline, description
- icon_url, screenshot_urls (ARRAY)
- url, app_store_url, play_store_url, github_url, twitter_url, youtube_url
- tags (ARRAY), status (released/beta/dev)
- tester_slots, tester_reward_points, likes_count
- created_at

### aa_likes / aa_comments / aa_points / aa_tester_applications / aa_app_updates / aa_boosts
- likes: id, user_id, app_id
- comments: id, user_id, app_id, content
- points: id, user_id, amount, reason, app_id（ポイント履歴、負の値で消費）
- tester_applications: id, app_id, user_id, message, status(pending/approved/rejected)
- app_updates: id, app_id, user_id, version, title, content
- boosts: id, app_id, user_id, expires_at（typeカラムはCHECK制約削除済み・送らない）

### RPC関数
- `get_home_apps(p_sort, p_tab, p_user_id, p_search)` → json
  - is_boosted(boolean)・username・badge を含む全アプリ取得
  - GRANT EXECUTE ON FUNCTION TO anon 済み
  - ORDER BY: is_boosted DESC → likes_count/created_at DESC

---

## 実装済み機能

### フロントエンド
- **ホーム（SSR）:** `app/page.tsx` → `components/HomeClient.tsx`
  - force-dynamic + 5秒タイムアウト
  - タブ: すべて / テスター募集 / マイアプリ
  - マイアプリタブ: ブーストボタン付きカード
- **アプリ詳細:** `app/apps/[id]/page.tsx`
  - いいね / コメント / テスター申請 / ブースト / アップデート投稿 / Xシェア
- **マイページ:** `app/profile/page.tsx`
  - プロフィール編集 / ポイント残高 / 投稿アプリ一覧（ブーストボタン付き）
- **PLATINUMページ:** `app/platinum/page.tsx`（ログイン状態で出し分け）

### ポイント制度
- いいね: +1pt（いいねした人・された開発者 両方）
- テスター承認: +tester_reward_points
- Xシェア: +10pt（1アプリ1回）
- ブースト: -50pt / 3日間（aa_boostsに期限付きレコード）

### バッジ
- PLATINUM: 先着150名（全登録者に一括付与済み）。ホームバナーは達成記念UI
- MASTER: 手動付与（オーナーのみ現在所持）
- 新規登録トリガー: assign_signup_badge（Supabase DB function）

### Supabaseインフラ
- Vercel: Pro ($20/月)
- Supabase: Pro + Micro compute
- ホームSSR: force-dynamic（キャッシュなし毎回フェッチ）

---

## 未実装・今後のTODO
- ヘッダーのモバイル対応（マイページ・マイアプリへのリンク不足）
- iOS App Store申請
- Google Play本番申請
- マネタイズ（ポイント購入導線、月額サブスク、スポンサー枠）
- 離脱防止（通知、週次ランキング、フォロー機能）

---

## スケーリング対策（将来・未実装）
- SSRキャッシュ: `export const revalidate = 60`（現在force-dynamic）
- Supabase Read Replica追加（Pro以上必要・契約済み）
