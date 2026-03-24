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
type FollowUser = { id: string; username: string; avatar_url: string | null; badge: string | null };

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
  const [profileColor, setProfileColor] = useState<string | null>(null);
  const [gachaBadge, setGachaBadge] = useState<string | null>(null);
  const [usernameUpdatedAt, setUsernameUpdatedAt] = useState<string | null>(null);
  const [apps, setApps] = useState<App[]>([]);
  const [points, setPoints] = useState(0);
  const [testerScore, setTesterScore] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [followingList, setFollowingList] = useState<FollowUser[]>([]);
  const [followTab, setFollowTab] = useState<"followers" | "following">("followers");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [boostedAppIds, setBoostedAppIds] = useState<Set<string>>(new Set());
  const [boostingId, setBoostingId] = useState<string | null>(null);
  const BOOST_COST = 50;
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [appCount, setAppCount] = useState<number | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");
  const [hasLiked, setHasLiked] = useState(false);
  const [hasAppliedTester, setHasAppliedTester] = useState(false);
  const [hasPostedUpdate, setHasPostedUpdate] = useState(false);
  const [hasSharedOnX, setHasSharedOnX] = useState(false);
  const [hasCommented, setHasCommented] = useState(false);
  const [hasBoosted, setHasBoosted] = useState(false);
  const [hasApprovedTester, setHasApprovedTester] = useState(false);
  const [hasRewardedComment, setHasRewardedComment] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth"); return; }
      setUser(data.user);

      const [profileRes, appsRes, pointsRes, testerRes, highRatingRes, followersRes, followingRes, likesRes, testerAppRes, updateRes, xShareRes, commentRes, boostAllRes] = await Promise.all([
        supabase.from("aa_profiles")
          .select("username, badge, username_updated_at, bio, twitter_url, github_url, website_url, avatar_url, profile_color, gacha_badge")
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
        supabase.from("aa_follows").select("id", { count: "exact" }).eq("following_id", data.user.id),
        supabase.from("aa_follows").select("id", { count: "exact" }).eq("follower_id", data.user.id),
        supabase.from("aa_likes").select("id", { count: "exact", head: true }).eq("user_id", data.user.id),
        supabase.from("aa_tester_applications").select("id", { count: "exact", head: true }).eq("user_id", data.user.id),
        supabase.from("aa_app_updates").select("id", { count: "exact", head: true }).eq("user_id", data.user.id),
        supabase.from("aa_points").select("id", { count: "exact", head: true }).eq("user_id", data.user.id).eq("reason", "Xでシェア"),
        supabase.from("aa_comments").select("id", { count: "exact", head: true }).eq("user_id", data.user.id),
        supabase.from("aa_boosts").select("id", { count: "exact", head: true }).eq("user_id", data.user.id),
      ]);

      setUsername(profileRes.data?.username ?? "");
      setAvatarUrl(profileRes.data?.avatar_url ?? null);
      setBadge(profileRes.data?.badge ?? null);
      setProfileColor(profileRes.data?.profile_color ?? null);
      setGachaBadge(profileRes.data?.gacha_badge ?? null);
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
      setFollowersCount(followersRes.count ?? 0);
      setFollowingCount(followingRes.count ?? 0);
      setHasLiked((likesRes.count ?? 0) > 0);
      setHasAppliedTester((testerAppRes.count ?? 0) > 0);
      setHasPostedUpdate((updateRes.count ?? 0) > 0);
      setHasSharedOnX((xShareRes.count ?? 0) > 0);
      setHasCommented((commentRes.count ?? 0) > 0);
      setHasBoosted((boostAllRes.count ?? 0) > 0);

      // アプリIDを使った追加チェック（承認・報酬）
      const appIds = (appsRes.data ?? []).map((a: App) => a.id);
      if (appIds.length > 0) {
        const [approvedRes, rewardRes] = await Promise.all([
          supabase.from("aa_tester_applications").select("id", { count: "exact", head: true }).in("app_id", appIds).eq("status", "approved"),
          supabase.from("aa_points").select("id", { count: "exact", head: true }).in("app_id", appIds).like("reason", "%コメント報酬%"),
        ]);
        setHasApprovedTester((approvedRes.count ?? 0) > 0);
        setHasRewardedComment((rewardRes.count ?? 0) > 0);
      }

      if (profileRes.data?.badge === "master") {
        supabase.from("aa_profiles").select("*", { count: "exact", head: true })
          .then(({ count }) => setMemberCount(count ?? 0));
        supabase.from("aa_apps").select("*", { count: "exact", head: true })
          .then(({ count }) => setAppCount(count ?? 0));
      }

      setLoading(false);

      // フォロワーリスト取得
      supabase.from("aa_follows").select("follower_id").eq("following_id", data.user.id)
        .then(({ data: fData }) => {
          if (!fData || fData.length === 0) return;
          supabase.from("aa_profiles").select("id, username, avatar_url, badge")
            .in("id", fData.map((f: { follower_id: string }) => f.follower_id))
            .then(({ data: profiles }) => { if (profiles) setFollowers(profiles as FollowUser[]); });
        });
      // フォロー中リスト取得
      supabase.from("aa_follows").select("following_id").eq("follower_id", data.user.id)
        .then(({ data: fData }) => {
          if (!fData || fData.length === 0) return;
          supabase.from("aa_profiles").select("id, username, avatar_url, badge")
            .in("id", fData.map((f: { following_id: string }) => f.following_id))
            .then(({ data: profiles }) => { if (profiles) setFollowingList(profiles as FollowUser[]); });
        });
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
      setAvatarError("アップロードに失敗しました。時間をおいて再試行してください。");
    } else {
      const { data } = supabase.storage.from("aa-apps").getPublicUrl(path);
      const { error: dbError } = await supabase.from("aa_profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", user.id);
      if (dbError) {
        setAvatarError("保存に失敗しました。時間をおいて再試行してください。");
      } else {
        setAvatarUrl(data.publicUrl);
      }
    }
    setAvatarUploading(false);
  };

  const RESERVED_USERNAMES = ["admin", "master", "administrator", "root", "support", "official", "appatelier", "app_atelier", "system", "moderator", "mod", "staff", "help"];

  const handleSaveProfile = async () => {
    if (!user) return;
    const trimmed = username.trim().toLowerCase();
    if (RESERVED_USERNAMES.includes(trimmed)) {
      alert("そのユーザー名は使用できません");
      return;
    }
    if (username.trim().length > 30) {
      alert("ユーザー名は30文字以内にしてください");
      return;
    }
    if (bio.trim().length > 200) {
      alert("自己紹介は200文字以内にしてください");
      return;
    }
    // SNS URLはhttp(s)のみ許可
    const urlFields = [twitterUrl.trim(), githubUrl.trim(), websiteUrl.trim()];
    for (const u of urlFields) {
      if (u && !u.startsWith("http://") && !u.startsWith("https://")) {
        alert("URLはhttp://またはhttps://から始まる形式で入力してください");
        return;
      }
    }
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
    if (!user) return;
    if (points < BOOST_COST) {
      alert(`ブーストには${BOOST_COST}ptが必要です（現在${points}pt）`);
      return;
    }
    setBoostingId(appId);
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const { error: boostError } = await supabase.from("aa_boosts").insert({ app_id: appId, user_id: user.id, expires_at: expiresAt });
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

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeletingAccount(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/delete-account", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (!res.ok) {
      alert("削除に失敗しました。時間をおいて再試行してください。");
      setDeletingAccount(false);
      return;
    }
    await supabase.auth.signOut();
    router.push("/");
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

      {/* やることリスト（3段階ガイド） */}
      {(() => {
        const guide1 = [
          { done: !!avatarUrl, label: "プロフィール写真を設定する", href: undefined },
          { done: hasLiked, label: "アプリにいいねする（+1pt）", href: "/" },
          { done: hasAppliedTester, label: "テスターに申請する", href: "/testers" },
          { done: apps.length > 0, label: "アプリを投稿する", href: "/submit" },
        ];
        const guide2 = [
          { done: hasPostedUpdate, label: "アップデートを投稿する（+5pt）", href: apps.length > 0 ? `/apps/${apps[0].id}` : "/" },
          { done: followingCount > 0, label: "誰かをフォローする", href: "/" },
          { done: hasSharedOnX, label: "アプリをXでシェアする（+10pt）", href: apps.length > 0 ? `/apps/${apps[0].id}` : "/" },
          { done: hasCommented, label: "アプリにコメントをする", href: "/" },
        ];
        const guide3 = [
          { done: hasBoosted, label: "アプリをブーストする（-50pt）", href: undefined },
          { done: hasApprovedTester, label: "テスターを承認する", href: apps.length > 0 ? `/apps/${apps[0].id}/testers` : "/" },
          { done: hasRewardedComment, label: "コメントに報酬を付与する", href: apps.length > 0 ? `/apps/${apps[0].id}` : "/" },
          { done: apps.length >= 2, label: "2つ目のアプリを投稿する", href: "/submit" },
        ];

        const g1Done = guide1.filter((t) => t.done).length;
        const g2Done = guide2.filter((t) => t.done).length;
        const g3Done = guide3.filter((t) => t.done).length;
        const g1Complete = g1Done === guide1.length;
        const g2Complete = g2Done === guide2.length;
        const g3Complete = g3Done === guide3.length;

        const GuideSection = ({
          title, tasks, doneCount, total,
          borderCls, bgCls, barBg, barTrack, textCls, linkCls, dotCls,
        }: {
          title: string;
          tasks: { done: boolean; label: string; href: string | undefined }[];
          doneCount: number; total: number;
          borderCls: string; bgCls: string; barBg: string; barTrack: string;
          textCls: string; linkCls: string; dotCls: string;
        }) => (
          <section className={`mb-6 p-5 rounded-xl border ${borderCls} ${bgCls}`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-sm font-semibold ${textCls}`}>{title}</p>
              <span className={`text-xs ${textCls} opacity-70`}>{doneCount} / {total} 完了</span>
            </div>
            <div className={`w-full ${barTrack} rounded-full h-1.5 mb-4`}>
              <div className={`${barBg} h-1.5 rounded-full transition-all`} style={{ width: `${(doneCount / total) * 100}%` }} />
            </div>
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li key={task.label} className="flex items-center gap-2">
                  <span className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[10px] ${task.done ? dotCls : "border-zinc-300 dark:border-zinc-600"}`}>
                    {task.done ? "✓" : ""}
                  </span>
                  {task.done ? (
                    <span className="text-xs text-zinc-400 line-through">{task.label}</span>
                  ) : task.href ? (
                    <Link href={task.href} className={`text-xs ${linkCls} hover:underline`}>{task.label}</Link>
                  ) : (
                    <span className={`text-xs ${linkCls}`}>{task.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );

        return (
          <>
            {!g1Complete && (
              <GuideSection
                title="はじめてのガイド" tasks={guide1} doneCount={g1Done} total={guide1.length}
                borderCls="border-violet-200 dark:border-violet-800"
                bgCls="bg-violet-50 dark:bg-violet-950"
                barBg="bg-violet-500" barTrack="bg-violet-200 dark:bg-violet-900"
                textCls="text-violet-700 dark:text-violet-300"
                linkCls="text-violet-600 dark:text-violet-400"
                dotCls="border-violet-500 bg-violet-500 text-white"
              />
            )}
            {g1Complete && !g2Complete && (
              <GuideSection
                title="ステップ2 — 使い込もう" tasks={guide2} doneCount={g2Done} total={guide2.length}
                borderCls="border-blue-200 dark:border-blue-800"
                bgCls="bg-blue-50 dark:bg-blue-950"
                barBg="bg-blue-500" barTrack="bg-blue-200 dark:bg-blue-900"
                textCls="text-blue-700 dark:text-blue-300"
                linkCls="text-blue-600 dark:text-blue-400"
                dotCls="border-blue-500 bg-blue-500 text-white"
              />
            )}
            {g1Complete && g2Complete && !g3Complete && (
              <GuideSection
                title="ステップ3 — コミュニティを深める" tasks={guide3} doneCount={g3Done} total={guide3.length}
                borderCls="border-amber-200 dark:border-amber-800"
                bgCls="bg-amber-50 dark:bg-amber-950"
                barBg="bg-amber-500" barTrack="bg-amber-200 dark:bg-amber-900"
                textCls="text-amber-700 dark:text-amber-300"
                linkCls="text-amber-600 dark:text-amber-400"
                dotCls="border-amber-500 bg-amber-500 text-white"
              />
            )}
          </>
        );
      })()}

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
            {gachaBadge && (
              <span className="text-xl" title="ガチャバッジ">{gachaBadge}</span>
            )}
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
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium">ユーザー名</label>
            {profileColor && (
              <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span className="w-3 h-3 rounded-full inline-block border border-white shadow" style={{ backgroundColor: profileColor }} />
                ガチャカラー適用中
                <Link href="/gacha" className="underline hover:text-zinc-600">変更</Link>
              </span>
            )}
          </div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={30}
            disabled={!canChangeUsername()}
            className={`${inputCls} disabled:opacity-50 disabled:cursor-not-allowed`}
            style={profileColor ? { color: profileColor } : undefined}
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
        <div className="flex items-end gap-1 mb-3">
          <span className="text-3xl font-bold">{points.toLocaleString()}</span>
          <span className="text-sm text-zinc-400 mb-1">pt</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-zinc-500"><strong className="text-zinc-900 dark:text-zinc-100">{followersCount}</strong> フォロワー</span>
          <span className="text-zinc-500"><strong className="text-zinc-900 dark:text-zinc-100">{followingCount}</strong> フォロー中</span>
        </div>
        {memberCount !== null && (
          <div className="mt-3 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 text-sm font-semibold">
              👥 会員登録数: {memberCount.toLocaleString()} 人
            </div>
            {appCount !== null && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-semibold">
                📱 登録アプリ数: {appCount.toLocaleString()} 件
              </div>
            )}
            <a href="/admin" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
              🚩 通報管理
            </a>
            <a href="/gacha" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
              🎰 ガチャ
            </a>
          </div>
        )}
      </section>

      {/* Follow list */}
      <section className="mb-8 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-4 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <button onClick={() => setFollowTab("followers")}
            className={`text-sm font-medium transition-colors ${followTab === "followers" ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}>
            フォロワー {followersCount}
          </button>
          <button onClick={() => setFollowTab("following")}
            className={`text-sm font-medium transition-colors ${followTab === "following" ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}>
            フォロー中 {followingCount}
          </button>
        </div>
        <div className="space-y-1">
          {(followTab === "followers" ? followers : followingList).map((u) => (
            <Link key={u.id} href={`/users/${u.username}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400 flex-shrink-0">
                {u.avatar_url
                  ? <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                  : u.username[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium flex-1">{u.username}</span>
              {u.badge && <Badge badge={u.badge as "master" | "platinum" | "gold" | "silver" | "bronze"} size="xs" />}
            </Link>
          ))}
          {(followTab === "followers" ? followers : followingList).length === 0 && (
            <p className="text-sm text-zinc-400 py-2">
              {followTab === "followers" ? "フォロワーはまだいません" : "フォローしているユーザーはいません"}
            </p>
          )}
        </div>
      </section>

      {/* Premium plan (admin preview only) */}
      {user?.email === "scandalxxx.1119@gmail.com" && (
        <section className="mb-8 p-5 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">プレミアムプラン</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300">開発中</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">現在のプラン: <span className="font-semibold text-zinc-700 dark:text-zinc-200">無料</span></p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 space-y-2">
              <p className="font-bold text-sm">🥈 シルバー</p>
              <p className="text-2xl font-bold">¥300<span className="text-xs font-normal text-zinc-400">/月</span></p>
              <ul className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                <li>✓ プレミアムバッジ</li>
                <li>✓ 月100pt付与</li>
                <li>✓ 広告非表示</li>
              </ul>
              <button
                onClick={async () => {
                  const { data: { session } } = await supabase.auth.getSession();
                  const res = await fetch("/api/stripe/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
                    body: JSON.stringify({ priceId: process.env.NEXT_PUBLIC_STRIPE_SILVER_PRICE_ID }),
                  });
                  const { url } = await res.json();
                  if (url) window.location.href = url;
                }}
                className="w-full mt-2 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                加入する
              </button>
            </div>
            <div className="p-4 rounded-xl border-2 border-amber-400 dark:border-amber-500 space-y-2 relative">
              <span className="absolute -top-2.5 left-3 text-xs px-2 py-0.5 rounded-full bg-amber-400 text-white font-medium">人気</span>
              <p className="font-bold text-sm">🥇 ゴールド</p>
              <p className="text-2xl font-bold">¥980<span className="text-xs font-normal text-zinc-400">/月</span></p>
              <ul className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                <li>✓ ゴールドバッジ</li>
                <li>✓ 月500pt付与</li>
                <li>✓ 広告非表示</li>
                <li>✓ 優先サポート</li>
              </ul>
              <button
                onClick={async () => {
                  const { data: { session } } = await supabase.auth.getSession();
                  const res = await fetch("/api/stripe/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
                    body: JSON.stringify({ priceId: process.env.NEXT_PUBLIC_STRIPE_GOLD_PRICE_ID }),
                  });
                  const { url } = await res.json();
                  if (url) window.location.href = url;
                }}
                className="w-full mt-2 py-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
              >
                加入する
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Account deletion */}
      <section className="mb-8 p-5 rounded-xl border border-red-100 dark:border-red-900 bg-white dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-2">アカウント削除</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
          アカウントを削除すると、投稿したアプリ・コメント・ポイント等すべてのデータが完全に削除されます。
        </p>
        {!deleteAccountOpen ? (
          <button
            onClick={() => setDeleteAccountOpen(true)}
            className="px-4 py-2 rounded-lg border border-red-300 dark:border-red-800 text-red-500 text-sm hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            アカウントを削除する
          </button>
        ) : (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 space-y-3">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">本当に削除しますか？</p>
            <ul className="text-xs text-red-500 dark:text-red-400 space-y-1 list-disc list-inside">
              <li>投稿したアプリがすべて削除されます</li>
              <li>コメント・いいね・ポイント履歴が削除されます</li>
              <li>テスター申請・フォロー情報が削除されます</li>
              <li>この操作は取り消せません</li>
            </ul>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setDeleteAccountOpen(false)}
                className="flex-1 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deletingAccount ? "削除中..." : "完全に削除する"}
              </button>
            </div>
          </div>
        )}
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
              <div key={app.id} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="flex items-center gap-3 mb-3">
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
                    <p className="text-xs text-zinc-400 mt-0.5">♥ {app.likes_count}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
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
