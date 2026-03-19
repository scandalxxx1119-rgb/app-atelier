"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PLATFORM_TAGS, CATEGORY_TAGS } from "@/lib/tags";

type App = {
  id: string;
  name: string;
  tagline: string;
  url: string | null;
  icon_url: string | null;
  tags: string[] | null;
  likes_count: number;
  created_at: string;
  aa_profiles: { username: string } | null;
};

const SORT_OPTIONS = [
  { label: "新着", value: "created_at" },
  { label: "人気", value: "likes_count" },
];

export default function HomePage() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sort, setSort] = useState("created_at");

  useEffect(() => {
    setLoading(true);
    supabase
      .from("aa_apps")
      .select("*, aa_profiles(username)")
      .order(sort, { ascending: false })
      .then(({ data }) => {
        let filtered = (data as App[]) ?? [];
        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter(
            (a) =>
              a.name.toLowerCase().includes(q) ||
              a.tagline.toLowerCase().includes(q)
          );
        }
        if (selectedTags.length > 0) {
          filtered = filtered.filter((a) =>
            selectedTags.every((t) => a.tags?.includes(t))
          );
        }
        setApps(filtered);
        setLoading(false);
      });
  }, [sort, search, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">App Atelier</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          個人開発者が作ったアプリを発見・応援しよう
        </p>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="アプリを検索..."
          className="flex-1 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
        <div className="flex gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sort === opt.value
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                  : "border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tag filters */}
      <div className="mb-8 space-y-3">
        {/* Platform */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-400 w-20 flex-shrink-0">プラットフォーム</span>
          <div className="flex flex-wrap gap-1.5">
            {PLATFORM_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-400 w-20 flex-shrink-0">カテゴリ</span>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Clear */}
        {selectedTags.length > 0 && (
          <button
            onClick={() => setSelectedTags([])}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 underline"
          >
            フィルターをクリア（{selectedTags.length}個選択中）
          </button>
        )}
      </div>

      {/* App grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          <p className="text-lg mb-4">
            {search || selectedTags.length > 0
              ? "該当するアプリが見つかりません"
              : "まだアプリが投稿されていません"}
          </p>
          <Link
            href="/submit"
            className="px-5 py-2.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:opacity-80 transition-opacity text-sm"
          >
            最初のアプリを投稿する
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((app) => (
            <Link
              key={app.id}
              href={`/apps/${app.id}`}
              className="group block rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-start gap-3 mb-3">
                {app.icon_url ? (
                  <img
                    src={app.icon_url}
                    alt={app.name}
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 text-xl font-bold text-zinc-400">
                    {app.name[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="font-semibold truncate">{app.name}</h2>
                  <p className="text-xs text-zinc-400">
                    {app.aa_profiles?.username ?? "anonymous"}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-1 text-xs text-zinc-400 flex-shrink-0">
                  <span>♥</span>
                  <span>{app.likes_count}</span>
                </div>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3">
                {app.tagline}
              </p>
              {app.tags && app.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {app.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                    >
                      {tag}
                    </span>
                  ))}
                  {app.tags.length > 3 && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                      +{app.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
