"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PLATFORM_TAGS, CATEGORY_TAGS } from "@/lib/tags";
import Badge, { isPremiumBadge } from "@/components/Badge";
import type { BadgeType } from "@/components/Badge";
import type { User } from "@supabase/supabase-js";
import type { App } from "@/lib/types";

type RpcRow = Omit<App, "aa_profiles"> & { username?: string; badge?: string | null; is_boosted?: boolean };

const SORT_OPTIONS = [
  { label: "新着", value: "created_at" },
  { label: "人気", value: "likes_count" },
];

const PAGE_SIZE = 10;

function mapRpcRows(data: RpcRow[]): App[] {
  return data.map((a) => ({
    ...a,
    aa_profiles: a.username ? { username: a.username, badge: a.badge ?? null } : null,
    isBoosted: a.is_boosted ?? false,
  }));
}

export default function HomeClient({
  initialApps,
}: {
  initialApps: App[];
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
  const [userPoints, setUserPoints] = useState(0);
  const [boostedAppIds, setBoostedAppIds] = useState<Set<string>>(new Set());
  const [boostingId, setBoostingId] = useState<string | null>(null);
  const BOOST_COST = 50;
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

  useEffect(() => {
    if (!user) return;
    supabase.from("aa_points").select("amount").eq("user_id", user.id)
      .then(({ data }) => {
        const total = (data ?? []).reduce((sum: number, r: { amount: number }) => sum + r.amount, 0);
        setUserPoints(total);
      });
  }, [user]);

  useEffect(() => {
    if (tab !== "mine" || !user) return;
    supabase.from("aa_boosts").select("app_id").eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .then(({ data }) => {
        if (data) setBoostedAppIds(new Set(data.map((b: { app_id: string }) => b.app_id)));
      });
  }, [tab, user]);

  const togglePlatform = (tag: string) =>
    setSelectedPlatforms((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  const toggleCategory = (tag: string) =>
    setSelectedCategories((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  const handleBoost = async (appId: string, appName: string) => {
    if (!user) return;
    if (userPoints < BOOST_COST) {
      alert(`ブーストには${BOOST_COST}ptが必要です（現在${userPoints}pt）`);
      return;
    }
    setBoostingId(appId);
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const { error: boostError } = await supabase.from("aa_boosts").insert({ app_id: appId, user_id: user.id, expires_at: expiresAt });
    if (boostError) { alert("ブーストエラー: " + boostError.message); setBoostingId(null); return; }
    const { error: pointError } = await supabase.from("aa_points").insert({ user_id: user.id, amount: -BOOST_COST, reason: `「${appName}」をブースト`, app_id: appId });
    if (pointError) { alert("ポイントエラー: " + pointError.message); setBoostingId(null); return; }
    setBoostedAppIds((prev) => new Set([...prev, appId]));
    setUserPoints((p) => p - BOOST_COST);
    setBoostingId(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">App Atelier</h1>
        <p className="text-zinc-500 dark:text-zinc-400">個人開発者が作ったアプリを発見・応援しよう</p>
      </div>

      {/* 注目アプリ（ブースト中） */}
      {tab === "all" && apps.some((a) => a.isBoosted) && (
        <div className="mb-8">
          <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-3">🚀 注目アプリ</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {apps.filter((a) => a.isBoosted).map((app) => (
              <Link key={app.id} href={`/apps/${app.id}`}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 hover:border-amber-400 dark:hover:border-amber-600 transition-colors">
                {app.icon_url ? (
                  <img src={app.icon_url} alt={app.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-sm font-bold text-amber-400 flex-shrink-0">
                    {app.name[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate max-w-28">{app.name}</p>
                  <p className="text-xs text-zinc-400 truncate max-w-28">{app.aa_profiles?.username ?? "anonymous"}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

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
              <div key={app.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors overflow-hidden flex flex-col">
                <Link href={`/apps/${app.id}`} className="block p-5 flex-1">
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
                {tab === "mine" && (
                  <div className="px-5 py-2.5 border-t border-zinc-100 dark:border-zinc-800">
                    {boostedAppIds.has(app.id) ? (
                      <span className="text-xs text-amber-500 font-medium">🚀 ブースト中</span>
                    ) : (
                      <button
                        onClick={() => handleBoost(app.id, app.name)}
                        disabled={boostingId === app.id}
                        className="w-full py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950 text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {boostingId === app.id ? "処理中..." : `🚀 ブースト (${BOOST_COST}pt・3日間)`}
                      </button>
                    )}
                  </div>
                )}
              </div>
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
