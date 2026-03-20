"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Badge from "@/components/Badge";

type Profile = {
  id: string;
  username: string;
  badge: string | null;
  bio: string | null;
  twitter_url: string | null;
  github_url: string | null;
  website_url: string | null;
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

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("aa_profiles").select("id, username, badge, bio, twitter_url, github_url, website_url")
      .eq("username", decodeURIComponent(username)).single()
      .then(async ({ data }) => {
        if (!data) { setLoading(false); return; }
        setProfile(data as Profile);
        const { data: appsData } = await supabase.from("aa_apps")
          .select("id, name, tagline, icon_url, tags, likes_count, status")
          .eq("user_id", data.id).order("created_at", { ascending: false });
        setApps((appsData as App[]) ?? []);
        setLoading(false);
      });
  }, [username]);

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
        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl font-bold text-zinc-400">
          {profile.username[0].toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold">{profile.username}</h1>
            {profile.badge && <Badge badge={profile.badge as "master" | "platinum" | "gold" | "silver" | "bronze"} />}
          </div>
          {profile.bio && <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">{profile.bio}</p>}
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sm text-zinc-400">{apps.length}個のアプリを投稿</p>
            {profile.twitter_url && <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors font-bold">𝕏</a>}
            {profile.github_url && <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">GitHub</a>}
            {profile.website_url && <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">🌐 Web</a>}
          </div>
        </div>
      </div>

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
