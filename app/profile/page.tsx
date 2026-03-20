"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Badge from "@/components/Badge";
import type { User } from "@supabase/supabase-js";

type App = {
  id: string;
  name: string;
  tagline: string;
  icon_url: string | null;
  likes_count: number;
  status: string | null;
};

type BadgeType = "master" | "platinum" | "gold" | "silver" | "bronze" | null;

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const avatarRef = useRef<HTMLInputElement>(null);
  const [twitterUrl, setTwitterUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [badge, setBadge] = useState<BadgeType>(null);
  const [usernameUpdatedAt, setUsernameUpdatedAt] = useState<string | null>(null);
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth"); return; }
      setUser(data.user);

      const [profileRes, appsRes] = await Promise.all([
        supabase.from("aa_profiles")
          .select("username, badge, username_updated_at, bio, twitter_url, github_url, website_url, avatar_url")
          .eq("id", data.user.id).single(),
        supabase.from("aa_apps")
          .select("id, name, tagline, icon_url, likes_count, status")
          .eq("user_id", data.user.id).order("created_at", { ascending: false }),
      ]);

      setUsername(profileRes.data?.username ?? "");
      setAvatarUrl(profileRes.data?.avatar_url ?? null);
      setBadge(profileRes.data?.badge ?? null);
      setUsernameUpdatedAt(profileRes.data?.username_updated_at ?? null);
      setBio(profileRes.data?.bio ?? "");
      setTwitterUrl(profileRes.data?.twitter_url ?? "");
      setGithubUrl(profileRes.data?.github_url ?? "");
      setWebsiteUrl(profileRes.data?.website_url ?? "");
      setApps((appsRes.data as App[]) ?? []);
      setLoading(false);
    });
  }, [router]);

  const canChangeUsername = () => {
    if (!usernameUpdatedAt) return true;
    const days = (Date.now() - new Date(usernameUpdatedAt).getTime()) / (1000 * 60 * 60 * 24);
    return days >= 7;
  };

  const daysUntilChange = () => {
    if (!usernameUpdatedAt) return 0;
    const days = (Date.now() - new Date(usernameUpdatedAt).getTime()) / (1000 * 60 * 60 * 24);
    return Math.ceil(7 - days);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("aa-apps").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("aa-apps").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      await supabase.from("aa_profiles").upsert({ id: user.id, avatar_url: data.publicUrl });
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const now = canChangeUsername() && username.trim() ? new Date().toISOString() : usernameUpdatedAt;
    await supabase.from("aa_profiles").upsert({
      id: user.id,
      username: username.trim() || undefined,
      username_updated_at: canChangeUsername() ? now : usernameUpdatedAt,
      bio: bio.trim() || null,
      twitter_url: twitterUrl.trim() || null,
      github_url: githubUrl.trim() || null,
      website_url: websiteUrl.trim() || null,
    });
    if (canChangeUsername() && username.trim()) setUsernameUpdatedAt(now);
    setSaving(false);
  };

  const handleDelete = async (appId: string) => {
    await supabase.from("aa_apps").delete().eq("id", appId);
    setApps((prev) => prev.filter((a) => a.id !== appId));
    setDeleteId(null);
  };

  if (loading) return null;

  const inputCls = "w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 text-sm";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-8">マイページ</h1>

      {/* Profile */}
      <section className="mb-8 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => avatarRef.current?.click()}
            className="w-16 h-16 rounded-full overflow-hidden border-2 border-dashed border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 transition-colors flex-shrink-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              : <span className="text-2xl text-zinc-400">{username ? username[0].toUpperCase() : "?"}</span>
            }
          </button>
          <div>
            <p className="text-sm font-medium">プロフィール写真</p>
            <p className="text-xs text-zinc-400">クリックして変更</p>
          </div>
          <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">プロフィール</h2>
          <div className="flex items-center gap-3">
            {badge && <Badge badge={badge} />}
            {username && (
              <Link href={`/users/${username}`} className="text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 underline transition-colors">
                公開ページを見る →
              </Link>
            )}
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium mb-1">ユーザー名</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={30}
            disabled={!canChangeUsername()}
            className={`${inputCls} disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          {!canChangeUsername() && (
            <p className="text-xs text-amber-500 mt-1">あと{daysUntilChange()}日後に変更できます（7日に1回）</p>
          )}
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium mb-1">自己紹介</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={2}
            maxLength={200}
            placeholder="個人開発者です。iOSアプリを作っています。"
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Platform links */}
        <div>
          <label className="block text-sm font-medium mb-3">プラットフォームリンク</label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-7 text-center font-bold text-sm flex-shrink-0">𝕏</span>
              <input type="url" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)}
                placeholder="https://x.com/yourhandle" className={inputCls} />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-7 text-center text-lg flex-shrink-0">🐙</span>
              <input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/yourname" className={inputCls} />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-7 text-center text-lg flex-shrink-0">🌐</span>
              <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yoursite.com" className={inputCls} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-zinc-400">{user?.email}</p>
          <button onClick={handleSaveProfile} disabled={saving}
            className="px-5 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50">
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </section>

      {/* My apps */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
            投稿したアプリ（{apps.length}）
          </h2>
          <Link href="/submit" className="text-sm font-medium hover:underline">
            + 新しいアプリを追加
          </Link>
        </div>

        {apps.length === 0 ? (
          <p className="text-zinc-400 text-sm">まだアプリを投稿していません</p>
        ) : (
          <div className="space-y-3">
            {apps.map((app) => (
              <div key={app.id} className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                {app.icon_url ? (
                  <img src={app.icon_url} alt={app.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg font-bold text-zinc-400 flex-shrink-0">
                    {app.name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{app.name}</p>
                    {app.status && app.status !== "released" && (
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${app.status === "beta" ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300" : "bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300"}`}>
                        {app.status === "beta" ? "β" : "開発中"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 truncate">{app.tagline}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-400 mr-2">
                  <span>♥</span><span>{app.likes_count}</span>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link href={`/apps/${app.id}`}
                    className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    見る
                  </Link>
                  <Link href={`/apps/${app.id}/edit`}
                    className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    編集
                  </Link>
                  {deleteId === app.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(app.id)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">
                        削除確定
                      </button>
                      <button onClick={() => setDeleteId(null)}
                        className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                        キャンセル
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteId(app.id)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-red-200 dark:border-red-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
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
