"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Badge, { DevBadge, TesterBadge } from "@/components/Badge";
import { safeUrl } from "@/lib/sanitize";
import type { User } from "@supabase/supabase-js";

type Profile = {
  id: string;
  username: string;
  badge: string | null;
  bio: string | null;
  twitter_url: string | null;
  github_url: string | null;
  website_url: string | null;
  avatar_url: string | null;
};

type App = {
  id: string;
  name: string;
  tagline: string;
  icon_url: string | null;
  tags: string[] | null;
  likes_count: number;
  status: string | null;
};
type FollowUser = { id: string; username: string; avatar_url: string | null; badge: string | null };

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [apps, setApps] = useState<App[]>([]);
  const [testerScore, setTesterScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [followingList, setFollowingList] = useState<FollowUser[]>([]);
  const [followTab, setFollowTab] = useState<"followers" | "following">("followers");
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    supabase.from("aa_profiles").select("id, username, badge, bio, twitter_url, github_url, website_url, avatar_url")
      .eq("username", decodeURIComponent(username)).single()
      .then(async ({ data }) => {
        if (!data) { setLoading(false); return; }
        setProfile(data as Profile);
        const [appsRes, testerRes, highRatingRes, followersRes, followingRes] = await Promise.all([
          supabase.from("aa_apps")
            .select("id, name, tagline, icon_url, tags, likes_count, status")
            .eq("user_id", data.id).order("created_at", { ascending: false }),
          supabase.from("aa_tester_applications")
            .select("id", { count: "exact" })
            .eq("user_id", data.id).eq("status", "approved"),
          supabase.from("aa_points")
            .select("id", { count: "exact" })
            .eq("user_id", data.id)
            .like("reason", "%コメント報酬%")
            .gte("amount", 2),
          supabase.from("aa_follows").select("id", { count: "exact" }).eq("following_id", data.id),
          supabase.from("aa_follows").select("id", { count: "exact" }).eq("follower_id", data.id),
        ]);
        setApps((appsRes.data as App[]) ?? []);
        setTesterScore((testerRes.count ?? 0) + (highRatingRes.count ?? 0));
        setFollowersCount(followersRes.count ?? 0);
        setFollowingCount(followingRes.count ?? 0);
        setLoading(false);
      });
  }, [username]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user ?? null));
  }, []);

  useEffect(() => {
    if (!profile) return;
    // フォロワーリスト取得
    supabase.from("aa_follows").select("follower_id").eq("following_id", profile.id)
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        supabase.from("aa_profiles").select("id, username, avatar_url, badge")
          .in("id", data.map((f: { follower_id: string }) => f.follower_id))
          .then(({ data: profiles }) => { if (profiles) setFollowers(profiles as FollowUser[]); });
      });
    // フォロー中リスト取得
    supabase.from("aa_follows").select("following_id").eq("follower_id", profile.id)
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        supabase.from("aa_profiles").select("id, username, avatar_url, badge")
          .in("id", data.map((f: { following_id: string }) => f.following_id))
          .then(({ data: profiles }) => { if (profiles) setFollowingList(profiles as FollowUser[]); });
      });
  }, [profile]);

  useEffect(() => {
    if (!currentUser || !profile || currentUser.id === profile.id) return;
    supabase.from("aa_follows")
      .select("id")
      .eq("follower_id", currentUser.id)
      .eq("following_id", profile.id)
      .maybeSingle()
      .then(({ data }) => setIsFollowing(!!data));
  }, [currentUser, profile]);

  const handleFollow = async () => {
    if (!currentUser || !profile) return;
    setFollowLoading(true);
    if (isFollowing) {
      await supabase.from("aa_follows").delete()
        .eq("follower_id", currentUser.id)
        .eq("following_id", profile.id);
      setIsFollowing(false);
      setFollowersCount((n) => n - 1);
    } else {
      await supabase.from("aa_follows").insert({
        follower_id: currentUser.id,
        following_id: profile.id,
      });
      setIsFollowing(true);
      setFollowersCount((n) => n + 1);
    }
    setFollowLoading(false);
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="h-8 w-40 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse mb-8" />
    </div>
  );

  if (!profile) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center text-zinc-400">
      ユーザーが見つかりません
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl font-bold text-zinc-400 flex-shrink-0">
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
            : profile.username[0].toUpperCase()
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold">{profile.username}</h1>
            {profile.badge && <Badge badge={profile.badge as "master" | "platinum" | "gold" | "silver" | "bronze"} />}
            <DevBadge appCount={apps.length} />
            <TesterBadge score={testerScore} />
          </div>
          {profile.bio && <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">{profile.bio}</p>}
          <div className="flex items-center gap-3 text-sm text-zinc-400 mb-2">
            <span><strong className="text-zinc-900 dark:text-zinc-100">{followersCount}</strong> フォロワー</span>
            <span><strong className="text-zinc-900 dark:text-zinc-100">{followingCount}</strong> フォロー中</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <p className="text-sm text-zinc-400 mr-1">{apps.length}個のアプリを投稿</p>
            {safeUrl(profile.twitter_url) && (
              <a href={safeUrl(profile.twitter_url)!} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                𝕏 Twitter
              </a>
            )}
            {safeUrl(profile.github_url) && (
              <a href={safeUrl(profile.github_url)!} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                🐙 GitHub
              </a>
            )}
            {safeUrl(profile.website_url) && (
              <a href={safeUrl(profile.website_url)!} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                🌐 Web
              </a>
            )}
          </div>
        </div>
        {currentUser && currentUser.id !== profile.id && (
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${
              isFollowing
                ? "border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:border-red-300 hover:text-red-500"
                : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-80"
            }`}
          >
            {followLoading ? "..." : isFollowing ? "フォロー中" : "フォローする"}
          </button>
        )}
      </div>

      {/* フォロー/フォロワーリスト */}
      {(followersCount > 0 || followingCount > 0) && (
        <div className="mb-8 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
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
        </div>
      )}

      <div className="space-y-3">
        {apps.map((app) => (
          <Link key={app.id} href={`/apps/${app.id}`}
            className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
            {app.icon_url ? (
              <img src={app.icon_url} alt={app.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg font-bold text-zinc-400 flex-shrink-0">
                {app.name[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-medium truncate">{app.name}</p>
                {app.status && app.status !== "released" && (
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${app.status === "beta" ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300" : "bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300"}`}>
                    {app.status === "beta" ? "β" : "開発中"}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 truncate">{app.tagline}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-400 flex-shrink-0">
              <span>♥</span><span>{app.likes_count}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
