"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type UserRank = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  badge: string | null;
  total_points: number;
};

type DevRank = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  badge: string | null;
  total_likes: number;
  app_count: number;
};

const BADGE_COLOR: Record<string, string> = {
  master: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  platinum: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
  gold: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  silver: "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300",
  bronze: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
};

const RANK_MEDAL: Record<number, string> = { 0: "🥇", 1: "🥈", 2: "🥉" };

export default function RankingPage() {
  const [tab, setTab] = useState<"users" | "devs">("users");
  const [userRanks, setUserRanks] = useState<UserRank[]>([]);
  const [devRanks, setDevRanks] = useState<DevRank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankings();
  }, []);

  async function fetchRankings() {
    setLoading(true);

    // ユーザーランキング: ポイント合計
    const { data: pointsData } = await supabase
      .from("aa_points")
      .select("user_id, amount");

    // 開発者ランキング: アプリのいいね合計
    const { data: appsData } = await supabase
      .from("aa_apps")
      .select("user_id, likes_count");

    const { data: profiles } = await supabase
      .from("aa_profiles")
      .select("id, username, avatar_url, badge");

    if (!profiles) { setLoading(false); return; }

    const ownerIds = new Set(profiles.filter((p) => p.badge === "master").map((p) => p.id));
    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    // ユーザーランキング集計
    const pointsMap = new Map<string, number>();
    for (const row of pointsData ?? []) {
      if (ownerIds.has(row.user_id)) continue;
      pointsMap.set(row.user_id, (pointsMap.get(row.user_id) ?? 0) + row.amount);
    }
    const uRanks: UserRank[] = [...pointsMap.entries()]
      .filter(([, pts]) => pts > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 50)
      .map(([uid, pts]) => {
        const p = profileMap.get(uid);
        return {
          user_id: uid,
          username: p?.username ?? uid,
          avatar_url: p?.avatar_url ?? null,
          badge: p?.badge ?? null,
          total_points: pts,
        };
      });
    setUserRanks(uRanks);

    // 開発者ランキング集計
    const likesMap = new Map<string, { likes: number; apps: number }>();
    for (const row of appsData ?? []) {
      if (ownerIds.has(row.user_id)) continue;
      const prev = likesMap.get(row.user_id) ?? { likes: 0, apps: 0 };
      likesMap.set(row.user_id, { likes: prev.likes + row.likes_count, apps: prev.apps + 1 });
    }
    const dRanks: DevRank[] = [...likesMap.entries()]
      .sort(([, a], [, b]) => b.likes - a.likes)
      .slice(0, 50)
      .map(([uid, { likes, apps }]) => {
        const p = profileMap.get(uid);
        return {
          user_id: uid,
          username: p?.username ?? uid,
          avatar_url: p?.avatar_url ?? null,
          badge: p?.badge ?? null,
          total_likes: likes,
          app_count: apps,
        };
      });
    setDevRanks(dRanks);

    setLoading(false);
  }

  const rows = tab === "users" ? userRanks : devRanks;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">ランキング</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("users")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "users"
              ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          }`}
        >
          ポイントランキング
        </button>
        <button
          onClick={() => setTab("devs")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "devs"
              ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          }`}
        >
          開発者ランキング
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-400">読み込み中...</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">データがありません</div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <Link
              key={row.user_id}
              href={`/users/${row.username}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
            >
              <div className="w-8 text-center text-lg font-bold text-zinc-400">
                {RANK_MEDAL[i] ?? <span className="text-sm">{i + 1}</span>}
              </div>

              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex-shrink-0">
                {row.avatar_url ? (
                  <img src={row.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400 text-lg">👤</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-sm truncate">{row.username}</span>
                  {row.badge && (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${BADGE_COLOR[row.badge] ?? ""}`}>
                      {row.badge.toUpperCase()}
                    </span>
                  )}
                </div>
                {tab === "devs" && (
                  <p className="text-xs text-zinc-400">{(row as DevRank).app_count}本投稿</p>
                )}
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-bold text-sm">
                  {tab === "users"
                    ? `${(row as UserRank).total_points.toLocaleString()} pt`
                    : `♥ ${(row as DevRank).total_likes.toLocaleString()}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
