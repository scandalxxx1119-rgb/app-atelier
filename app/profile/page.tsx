"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabase";
import Badge, { DevBadge, TesterBadge } from "@/components/Badge";
import { validateImageFile } from "@/lib/sanitize";
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
  const [points, setPoints] = useState(0);
  const [testerScore, setTesterScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [boostedAppIds, setBoostedAppIds] = useState<Set<string>>(new Set());
  const [boostingId, setBoostingId] = useState<string | null>(null);
  const BOOST_COST = 50;
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth"); return; }
      setUser(data.user);

      const [profileRes, appsRes, pointsRes, testerRes, highRatingRes] = await Promise.all([
        supabase.from("aa_profiles")
          .select("username, badge, username_updated_at, bio, twitter_url, github_url, website_url, avatar_url")
          .eq("id", data.user.id).single(),
        supabase.from("aa_apps")
          .select("id, name, tagline, icon_url, likes_count, status")
          .eq("user_id", data.user.id).order("created_at", { ascending: false }),
        supabase.from("aa_points")
          .select("amount")
          .eq("user_id", data.user.id),
        supabase.from("aa_tester_applications")
          .select("id", { count: "exact" })
          .eq("user_id", data.user.id).eq("status", "approved"),
        supabase.from("aa_points")
          .select("id", { count: "exact" })
          .eq("user_id", data.user.id)
          .like("reason", "%コメント報酬%")
          .gte("amount", 2),
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
      const total = (pointsRes.data ?? []).reduce((sum: number, r: { amount: number }) => sum + r.amount, 0);
      setPoints(total);
      // ブースト済みアプリを取得
      supabase.from("aa_boosts").select("app_id").eq("user_id", data.user.id)
        .gt("expires_at", new Date().toISOString())
        .then(({ data: boostData }) => {
          if (boostData) setBoostedAppIds(new Set(boostData.map((b: { app_id: string }) => b.app_id)));
        });
      setTesterScore((testerRes.count ?? 0) + (highRatingRes.count ?? 0));
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
    setAvatarError("");
    const sizeError = validateImageFile(file, 5);
    if (sizeError) { setAvatarError(sizeError); return; }
    setAvatarUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("aa-apps").upload(path, file);
    if (error) {
      setAvatarError("アップロードに失敗しました: " + error.message);
    } else {
      const { data } = supabase.storage.from("aa-apps").getPublicUrl(path);
      const { error: dbError } = await supabase.from("aa_profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", user.id);
      if (dbError) {
        setAvatarError("保存に失敗しました: " + dbError.message);
      } else {
        setAvatarUrl(data.publicUrl);
      }
    }
    setAvatarUploading(false);
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

  const handleEmailChange = async () => {
    if (!newEmail.trim() || newEmail === user?.email) return;
    setEmailSaving(true);
    setEmailMsg("");
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) {
      setEmailMsg("変更に失敗しました: " + error.message);
    } else {
      setEmailMsg("確認メールを送信しました。新しいメールアドレスのリンクをクリックしてください。");
      setNewEmail("");
    }
    setEmailSaving(false);
  };

  const handleBoost = async (appId: string, appName: string) => {
    if (!user) { alert("未ログイン"); return; }
    alert(`points=${points}, cost=${BOOST_COST}`);
    if (points < BOOST_COST) {
      alert(`ブーストには${BOOST_COST}ptが必要です（現在${points}pt）`);
      return;
    }
    setBoostingId(appId);
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const { error: boostError } = await supabase.from("aa_boosts").insert({ app_id: appId, user_id: user.id, type: "featured", expires_at: expiresAt });
    if (boostError) { alert("ブーストエラー: " + boostError.message); setBoostingId(null); return; }
    const { error: pointError } = await supabase.from("aa_points").insert({ user_id: user.id, amount: -BOOST_COST, reason: `「${appName}」をブースト`, app_id: appId });
    if (pointError) { alert("ポイントエラー: " + pointError.message); setBoostingId(null); return; }
    setBoostedAppIds((prev) => new Set([...prev, appId]));
    setPoints((p) => p - BOOST_COST);
    setBoostingId(null);
  };

  const handleDelete = async (appId: string) => {
    await supabase.from("aa_apps").delete().eq("id", appId).eq("user_id", user!.id);
    setApps((prev) => prev.filter((a) => a.id !== appId));
    setDeleteId(null);
  };

  if (loading) return null;

  const inputCls = "w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 text-sm";

  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">マイページ</h1>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="テーマ切替"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>

      {/* Profile */}
      <section className="mb-8 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => avatarRef.current?.click()}
            disabled={avatarUploading}
            className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-dashed border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 transition-colors flex-shrink-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 disabled:opacity-70">
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              : <span className="text-2xl text-zinc-400">{username ? username[0].toUpperCase() : "?"}</span>
            }
            {avatarUploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>
          <div>
            <p className="text-sm font-medium">プロフィール写真</p>
            <p className="text-xs text-zinc-400">{avatarUploading ? "アップロード中..." : "クリックして変更"}</p>
            {avatarError && <p className="text-xs text-red-500 mt-1">{avatarError}</p>}
          </div>
          <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">プロフィール</h2>
          <div className="flex items-center gap-3">
            {badge && <Badge badge={badge} />}
            <DevBadge appCount={apps.length} />
            <TesterBadge score={testerScore} />
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

        {/* Email change */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <label className="block text-sm font-medium mb-1">メールアドレス変更</label>
          <div className="flex gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="新しいメールアドレス"
              className={inputCls}
            />
            <button onClick={handleEmailChange} disabled={emailSaving || !newEmail.trim()}
              className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50 flex-shrink-0">
              {emailSaving ? "送信中..." : "変更"}
            </button>
          </div>
          {emailMsg && <p className="text-xs mt-1 text-zinc-500">{emailMsg}</p>}
        </div>
      </section>

      {/* Points */}
      <section className="mb-8 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">ポイント残高</h2>
        <div className="flex items-end gap-1">
          <span className="text-3xl font-bold">{points.toLocaleString()}</span>
          <span className="text-sm text-zinc-400 mb-1">pt</span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">テスター参加などで獲得できます</p>
      </section>

      {/* Account deletion */}
      <section className="mb-8 p-5 rounded-xl border border-red-100 dark:border-red-900 bg-white dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-2">アカウント削除</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
          アカウントを削除する場合は、<a href="/contact" className="underline hover:text-zinc-900 dark:hover:text-zinc-100">お問い合わせ</a>からご連絡ください。投稿したアプリ・コメント等のデータも削除します。
        </p>
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
                <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                  {boostedAppIds.has(app.id) ? (
                    <span className="px-3 py-1.5 text-xs rounded-lg border border-amber-200 dark:border-amber-800 text-amber-500 font-medium">
                      🚀 ブースト中
                    </span>
                  ) : (
                    <button
                      onClick={() => handleBoost(app.id, app.name)}
                      disabled={boostingId === app.id}
                      className="px-3 py-1.5 text-xs rounded-lg border border-amber-200 dark:border-amber-800 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors disabled:opacity-50"
                    >
                      {boostingId === app.id ? "処理中..." : `🚀 ブースト`}
                    </button>
                  )}
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
