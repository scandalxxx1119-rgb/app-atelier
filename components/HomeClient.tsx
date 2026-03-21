"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PLATFORM_TAGS, CATEGORY_TAGS } from "@/lib/tags";
import Badge, { isPremiumBadge } from "@/components/Badge";
import type { BadgeType } from "@/components/Badge";
import type { User } from "@supabase/supabase-js";
import type { App } from "@/lib/types";

type RpcRow = Omit<App, "aa_profiles"> & { username?: string; badge?: string | null };

const SORT_OPTIONS = [
  { label: "新着", value: "created_at" },
  { label: "人気", value: "likes_count" },
];

const PAGE_SIZE = 10;

function mapRpcRows(data: RpcRow[]): App[] {
  return data.map((a) => ({
    ...a,
    aa_profiles: a.username ? { username: a.username, badge: a.badge ?? null } : null,
  }));
}

export default function HomeClient({
  initialApps,
  platinumCount,
  platinumLimit = 150,
}: {
  initialApps: App[];
  platinumCount: number;
  platinumLimit?: number;
}) {
  const [apps, setApps] = useState<App[]>(initialApps);
  // サーバーデータがない場合はクライアントでフェッチが必要
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sort, setSort] = useState("created_at");
  const [tab, setTab] = useState<"all" | "testers" | "mine">("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  // サーバーデータがある場合のみ初回フェッチをスキップ
  const isInitialRender = useRef(initialApps.length > 0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ?? null)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  const selectedTags = [...selectedPlatforms, ...selectedCategories];

  useEffect(() => {
    // サーバーデータがある場合は初回マウントをスキップ
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    if (tab === "mine" && !user) return;
    setLoading(true);

    const fetchApps = async () => {
      try {
        const { data, error } = await supabase.rpc("get_home_apps", {
          p_sort: sort,
          p_tab: tab,
          p_user_id: user?.id ?? null,
          p_search: search,
        });
        if (error || !data) throw new Error("rpc failed");

        let appsData = mapRpcRows(data as RpcRow[]);
        if (selectedPlatforms.length > 0)
          appsData = appsData.filter((a) => selectedPlatforms.every((t) => a.tags?.includes(t)));
        if (selectedCategories.length > 0)
          appsData = appsData.filter((a) => selectedCategories.every((t) => a.tags?.includes(t)));
        if (tab !== "mine") {
          const boostScore = (a: App) =>
            a.isBoosted ? 2 : isPremiumBadge(a.aa_profiles?.badge as BadgeType) ? 1 : 0;
          appsData.sort((a, b) => boostScore(b) - boostScore(a));
        }
        setApps(appsData);
      } catch {
        let query = supabase.from("aa_apps").select("*").order(sort, { ascending: false }).limit(100);
        if (tab === "mine" && user) query = query.eq("user_id", user.id);
        if (tab === "testers") query = query.gt("tester_slots", 0);
        const { data: fallbackData } = await query;
        setApps((fallbackData as App[]) ?? []);
      } finally {
        setLoading(false);
      }
    };

    fetchApps();
  }, [sort, search, selectedPlatforms, selectedCategories, tab, user]);

  useEffect(() => { setCurrentPage(1); }, [sort, search, selectedPlatforms, selectedCategories, tab]);

  const togglePlatform = (tag: string) =>
    setSelectedPlatforms((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  const toggleCategory = (tag: string) =>
    setSelectedCategories((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">App Atelier</h1>
        <p className="text-zinc-500 dark:text-zinc-400">個人開発者が作ったアプリを発見・応援しよう</p>
      </div>

      {/* Platinum badge counter */}
      <Link href="/platinum" className="block mb-8">
        <div className="rounded-xl p-4 bg-gradient-to-r from-sky-100 via-cyan-50 to-indigo-100 dark:from-sky-950 dark:via-cyan-950 dark:to-indigo-950 border border-sky-200 dark:border-sky-800">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-sky-600 dark:text-sky-400 font-medium mb-0.5">先着{platinumLimit}名限定特典</p>
              <p className="font-bold text-zinc-900 dark:text-zinc-100">
                PLATINUM会員
                <span className="ml-2 text-2xl text-sky-600 dark:text-sky-400">{platinumCount}</span>
                <span className="text-zinc-400 dark:text-zinc-500 font-normal text-sm"> / {platinumLimit} 人</span>
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">今すぐ登録すると PLATINUMバッジがもらえます</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="flex items-center gap-1 mb-1">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className={`h-2 w-6 rounded-full ${i < Math.ceil((platinumCount / platinumLimit) * 10) ? "bg-sky-400 dark:bg-sky-500" : "bg-zinc-200 dark:bg-zinc-700"}`} />
                ))}
              </div>
              <p className="text-xs text-sky-600 dark:text-sky-400 font-bold">残り {platinumLimit - platinumCount} 枠</p>
            </div>
          </div>
        </div>
      </Link>

      {/* Tabs */}
      <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 mb-4">
        {(["all", "testers"] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setSearchOpen(false); }}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${tab === t ? "border-b-2 border-zinc-900 dark:border-white text-zinc-900 dark:text-white" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}>
            {t === "all" ? "すべて" : "🧪 テスター募集"}
          </button>
        ))}
        <button
          onClick={() => { setSearchOpen((v) => !v); setTab("all"); }}
          className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${searchOpen ? "border-b-2 border-zinc-900 dark:border-white text-zinc-900 dark:text-white" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}>
          🔍 検索
        </button>
        {user && (
          <button onClick={() => { setTab("mine"); setSearchOpen(false); }}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ml-auto ${tab === "mine" ? "border-b-2 border-zinc-900 dark:border-white text-zinc-900 dark:text-white" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}>
            マイアプリ
          </button>
        )}
      </div>

      {/* 検索バー */}
      {searchOpen && (
        <div className="mb-4">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="アプリ名・説明を検索..." autoFocus
            className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
        </div>
      )}

      {/* フィルター + ソート */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <div className="relative">
          <button onClick={() => { setPlatformOpen((v) => !v); setCategoryOpen(false); }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border transition-colors ${selectedPlatforms.length > 0 ? "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}>
            プラットフォーム {selectedPlatforms.length > 0 && `(${selectedPlatforms.length})`}
            <span className="text-xs">{platformOpen ? "▲" : "▼"}</span>
          </button>
          {platformOpen && (
            <div className="absolute top-full left-0 mt-1 z-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg p-3 flex flex-wrap gap-1.5 w-64">
              {PLATFORM_TAGS.map((tag) => (
                <button key={tag} onClick={() => togglePlatform(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedPlatforms.includes(tag) ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}>
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <button onClick={() => { setCategoryOpen((v) => !v); setPlatformOpen(false); }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border transition-colors ${selectedCategories.length > 0 ? "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}>
            カテゴリ {selectedCategories.length > 0 && `(${selectedCategories.length})`}
            <span className="text-xs">{categoryOpen ? "▲" : "▼"}</span>
          </button>
          {categoryOpen && (
            <div className="absolute top-full left-0 mt-1 z-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg p-3 flex flex-wrap gap-1.5 w-72">
              {CATEGORY_TAGS.map((tag) => (
                <button key={tag} onClick={() => toggleCategory(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedCategories.includes(tag) ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}>
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedTags.length > 0 && (
          <button onClick={() => { setSelectedPlatforms([]); setSelectedCategories([]); }}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 underline">
            クリア（{selectedTags.length}）
          </button>
        )}
        <div className="flex gap-1.5 ml-auto">
          {SORT_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => setSort(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sort === opt.value ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          <p className="text-lg mb-4">
            {tab === "mine" ? "まだアプリを投稿していません" : tab === "testers" ? "テスター募集中のアプリはありません" : search || selectedTags.length > 0 ? "該当するアプリが見つかりません" : "まだアプリが投稿されていません"}
          </p>
          <Link href="/submit" className="px-5 py-2.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:opacity-80 transition-opacity text-sm">
            {tab === "mine" ? "最初のアプリを投稿する" : "アプリを投稿する"}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {apps.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((app) => (
              <Link key={app.id} href={`/apps/${app.id}`}
                className="group block rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  {app.icon_url ? (
                    <img src={app.icon_url} alt={app.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 text-xl font-bold text-zinc-400">
                      {app.name[0]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold truncate">{app.name}</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-zinc-400 truncate">{app.aa_profiles?.username ?? "anonymous"}</p>
                      {app.aa_profiles?.badge && (
                        <Badge badge={app.aa_profiles.badge as "master" | "platinum" | "gold" | "silver" | "bronze"} size="xs" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-zinc-400 flex-shrink-0">
                    <span>♥</span><span>{app.likes_count}</span>
                  </div>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3">{app.tagline}</p>
                <div className="flex flex-wrap gap-1">
                  {app.isBoosted && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 font-medium">🚀 注目</span>
                  )}
                  {(!app.status || app.status === "released") && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 font-medium">✓ リリース済み</span>
                  )}
                  {app.status === "beta" && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-medium">β ベータ版</span>
                  )}
                  {app.status === "dev" && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 font-medium">🚧 開発中</span>
                  )}
                  {app.tags && app.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">{tag}</span>
                  ))}
                  {app.tags && app.tags.length > 3 && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">+{app.tags.length - 3}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
          {apps.length > PAGE_SIZE && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button onClick={() => { setCurrentPage((p) => p - 1); window.scrollTo(0, 0); }}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                ← 前へ
              </button>
              <span className="text-sm text-zinc-500">{currentPage} / {Math.ceil(apps.length / PAGE_SIZE)}ページ</span>
              <button onClick={() => { setCurrentPage((p) => p + 1); window.scrollTo(0, 0); }}
                disabled={currentPage >= Math.ceil(apps.length / PAGE_SIZE)}
                className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                次へ →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
