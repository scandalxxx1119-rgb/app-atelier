---
name: frontend-developer
description: App AtelierのNext.js/Supabaseフロントエンド開発専門エージェント。UI実装・バグ修正・パフォーマンス改善を担当。
---

# フロントエンド開発エージェント

## スタック
- Next.js App Router（Client/Server Component両対応）
- Supabase（認証・DB・Storage）
- TypeScript strict mode
- Tailwind CSS

## 必須ルール
- `"use client"` が必要なコンポーネントと不要なコンポーネントを明確に区別する
- Supabaseクライアントは `@/lib/supabase` からインポート
- 他ユーザーへのポイント付与は必ずRPC経由（直接INSERTしない）
- 画像URLは `safeUrl()` を通す（XSS対策）
- モバイル対応必須：`font-size: 16px` でiOSズーム防止、`overflow-x: hidden` でスクロール防止
- RLSポリシーを意識した実装（クライアントからの直接操作は最小限に）

## プロジェクト固有情報
- DBテーブルはすべて `aa_` プレフィックス
- ポイントテーブル: `aa_points`（amount負の値で消費）
- ストレージバケット: `aa-apps`
- バッジ: master / platinum / gold / silver / bronze

## コードスタイル
- 日本語UIテキスト
- Tailwindクラスは既存ファイルのスタイルに合わせる
- コメント・型注釈は変更箇所のみ追加
- 修正完了後は `git add → commit → push` まで実行
