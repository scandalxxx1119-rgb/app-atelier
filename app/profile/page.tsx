"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type App = {
  id: string;
  name: string;
  tagline: string;
  icon_url: string | null;
  likes_count: number;
  created_at: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push("/auth");
        return;
      }
      setUser(data.user);

      const [profileRes, appsRes] = await Promise.all([
        supabase
          .from("aa_profiles")
          .select("username")
          .eq("id", data.user.id)
          .single(),
        supabase
          .from("aa_apps")
          .select("id, name, tagline, icon_url, likes_count, created_at")
          .eq("user_id", data.user.id)
          .order("created_at", { ascending: false }),
      ]);

      setUsername(profileRes.data?.username ?? "");
      setApps((appsRes.data as App[]) ?? []);
      setLoading(false);
    });
  }, [router]);

  const handleSaveProfile = async () => {
    if (!user || !username.trim()) return;
    setSaving(true);
    await supabase
      .from("aa_profiles")
      .upsert({ id: user.id, username: username.trim() });
    setSaving(false);
  };

  const handleDelete = async (appId: string) => {
    await supabase.from("aa_apps").delete().eq("id", appId);
    setApps((prev) => prev.filter((a) => a.id !== appId));
    setDeleteId(null);
  };

  if (loading) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-8">マイページ</h1>

      {/* Profile section */}
      <section className="mb-10 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">
          プロフィール
        </h2>
        <div className="flex gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">ユーザー名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={30}
              className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 text-sm"
            />
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="self-end px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
        <p className="text-xs text-zinc-400 mt-2">{user?.email}</p>
      </section>

      {/* My apps */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
            投稿したアプリ（{apps.length}）
          </h2>
          <Link
            href="/submit"
            className="text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
          >
            + 新しいアプリを追加
          </Link>
        </div>

        {apps.length === 0 ? (
          <p className="text-zinc-400 text-sm">まだアプリを投稿していません</p>
        ) : (
          <div className="space-y-3">
            {apps.map((app) => (
              <div
                key={app.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              >
                {app.icon_url ? (
                  <img
                    src={app.icon_url}
                    alt={app.name}
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg font-bold text-zinc-400 flex-shrink-0">
                    {app.name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{app.name}</p>
                  <p className="text-xs text-zinc-400 truncate">{app.tagline}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-400 mr-2">
                  <span>♥</span>
                  <span>{app.likes_count}</span>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link
                    href={`/apps/${app.id}`}
                    className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    見る
                  </Link>
                  {deleteId === app.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(app.id)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        削除確定
                      </button>
                      <button
                        onClick={() => setDeleteId(null)}
                        className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        キャンセル
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteId(app.id)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-red-200 dark:border-red-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                    >
                      削除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
