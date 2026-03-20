"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Badge from "@/components/Badge";
import type { User } from "@supabase/supabase-js";

type App = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string | null;
  app_store_url: string | null;
  play_store_url: string | null;
  github_url: string | null;
  icon_url: string | null;
  screenshot_urls: string[] | null;
  tags: string[] | null;
  likes_count: number;
  created_at: string;
  user_id: string;
  twitter_url: string | null;
  youtube_url: string | null;
  status: string | null;
  tester_slots: number;
  tester_reward_points: number;
};

type Profile = {
  id: string;
  username: string;
  badge: string | null;
  avatar_url: string | null;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile?: { username: string };
};

type Application = {
  id: string;
  user_id: string;
  status: string;
  message: string | null;
};

function getYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&\n?#]+)/);
  return match ? match[1] : null;
}

export default function AppDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [app, setApp] = useState<App | null>(null);
  const [developer, setDeveloper] = useState<Profile | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentProfiles, setCommentProfiles] = useState<Record<string, string>>({});
  const [user, setUser] = useState<User | null>(null);
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeShot, setActiveShot] = useState(0);
  const [copied, setCopied] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [applyMsg, setApplyMsg] = useState("");
  const [applyOpen, setApplyOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [totalApplicants, setTotalApplicants] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // アプリ取得（joinなし）
    supabase.from("aa_apps").select("*").eq("id", id).single()
      .then(({ data }) => {
        if (!data) return;
        setApp(data as App);
        // 開発者プロフィールを別途取得
        supabase.from("aa_profiles").select("id, username, badge, avatar_url")
          .eq("id", data.user_id).single()
          .then(({ data: p }) => { if (p) setDeveloper(p as Profile); });
      });

    // コメント取得
    supabase.from("aa_comments").select("*").eq("app_id", id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!data) return;
        setComments(data as Comment[]);
        const userIds = [...new Set(data.map((c: Comment) => c.user_id))];
        if (userIds.length > 0) {
          supabase.from("aa_profiles").select("id, username").in("id", userIds)
            .then(({ data: profiles }) => {
              const map: Record<string, string> = {};
              profiles?.forEach((p: { id: string; username: string }) => { map[p.id] = p.username; });
              setCommentProfiles(map);
            });
        }
      });

    // 申請数
    supabase.from("aa_tester_applications").select("id", { count: "exact" }).eq("app_id", id)
      .then(({ count }) => setTotalApplicants(count ?? 0));
  }, [id]);

  useEffect(() => {
    if (!user) return;
    supabase.from("aa_likes").select("id").eq("app_id", id).eq("user_id", user.id)
      .maybeSingle().then(({ data }) => setLiked(!!data));
    supabase.from("aa_tester_applications").select("*").eq("app_id", id).eq("user_id", user.id)
      .maybeSingle().then(({ data }) => setApplication(data as Application | null));
  }, [user, id]);

  const handleLike = async () => {
    if (!user) { router.push("/auth"); return; }
    if (liked) {
      await supabase.from("aa_likes").delete().eq("app_id", id).eq("user_id", user.id);
      setLiked(false);
      setApp((a) => a ? { ...a, likes_count: Math.max(0, a.likes_count - 1) } : a);
    } else {
      await supabase.from("aa_likes").insert({ app_id: id, user_id: user.id });
      setLiked(true);
      setApp((a) => a ? { ...a, likes_count: a.likes_count + 1 } : a);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !comment.trim()) return;
    setSubmitting(true);
    const { data } = await supabase.from("aa_comments")
      .insert({ app_id: id, user_id: user.id, content: comment.trim() })
      .select("*").single();
    if (data) {
      setComments((prev) => [...prev, data as Comment]);
      setCommentProfiles((prev) => ({ ...prev, [user.id]: prev[user.id] ?? user.email ?? "?" }));
    }
    setComment("");
    setSubmitting(false);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push("/auth"); return; }
    setApplying(true);
    const { data } = await supabase.from("aa_tester_applications")
      .insert({ app_id: id, user_id: user.id, message: applyMsg.trim() || null })
      .select("*").single();
    if (data) {
      setApplication(data as Application);
      setTotalApplicants((n) => n + 1);
      // ポイント付与
      if (app?.tester_reward_points) {
        await supabase.from("aa_points").insert({
          user_id: user.id,
          amount: app.tester_reward_points,
          reason: `「${app.name}」のテスターに参加`,
          app_id: id,
        });
      }
    }
    setApplyOpen(false);
    setApplying(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: app?.name, text: app?.tagline, url });
    else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleXShare = () => {
    const text = `${app?.name} - ${app?.tagline}`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, "_blank");
  };

  if (!app) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" style={{ width: `${80 - i * 15}%` }} />
        ))}
      </div>
    );
  }

  const youtubeId = app.youtube_url ? getYoutubeId(app.youtube_url) : null;
  const shots = app.screenshot_urls ?? [];
  const isTesterApp = (app.tester_slots ?? 0) > 0;
  const isOwner = user?.id === app.user_id;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start gap-5 mb-6">
        {app.icon_url ? (
          <img src={app.icon_url} alt={app.name} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-3xl font-bold text-zinc-400 flex-shrink-0">
            {app.name[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold mb-1">{app.name}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-2">{app.tagline}</p>
          {/* 開発者情報 */}
          <div className="flex items-center gap-2 flex-wrap">
            {developer ? (
              <>
                {developer.avatar_url ? (
                  <img src={developer.avatar_url} alt={developer.username} className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-500">
                    {developer.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <Link href={`/users/${developer.username}`} className="text-xs text-zinc-400 hover:underline">
                  {developer.username}
                </Link>
                {developer.badge && <Badge badge={developer.badge as "master" | "platinum" | "gold" | "silver" | "bronze"} size="xs" />}
              </>
            ) : (
              <span className="text-xs text-zinc-400">anonymous</span>
            )}
            {app.status && app.status !== "released" && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${app.status === "beta" ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300" : "bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300"}`}>
                {app.status === "beta" ? "β ベータ版" : "🚧 開発中"}
              </span>
            )}
            {isOwner && (
              <>
                <Link href={`/apps/${app.id}/edit`} className="text-xs text-zinc-400 hover:underline ml-1">編集</Link>
                {isTesterApp && (
                  <Link href={`/apps/${app.id}/testers`} className="text-xs text-blue-500 hover:underline">テスター管理</Link>
                )}
              </>
            )}
          </div>
        </div>
        <button onClick={handleLike} className="flex flex-col items-center gap-1 group flex-shrink-0">
          <span className={`text-2xl transition-all group-active:scale-125 ${liked ? "text-red-500" : "text-zinc-300 dark:text-zinc-600 hover:text-red-400"}`}>♥</span>
          <span className="text-sm text-zinc-500">{app.likes_count}</span>
        </button>
      </div>

      {/* Tags */}
      {app.tags && app.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {app.tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{tag}</span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-8">
        {app.app_store_url && <a href={app.app_store_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 transition-opacity">🍎 App Store</a>}
        {app.play_store_url && <a href={app.play_store_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 transition-opacity">▶ Google Play</a>}
        {app.url && <a href={app.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">🌐 Web</a>}
        {app.github_url && <a href={app.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">🐙 GitHub</a>}
        {app.twitter_url && <a href={app.twitter_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">𝕏 フォロー</a>}
        <button onClick={handleXShare} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ml-auto">𝕏 シェア</button>
        <button onClick={handleShare} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">{copied ? "✓ コピー済み" : "🔗 リンク"}</button>
      </div>

      {/* Tester recruitment */}
      {isTesterApp && (
        <div className="mb-8 p-5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">🧪 テスター募集中</span>
                <span className="text-xs text-blue-500 dark:text-blue-400">枠 {totalApplicants}/{app.tester_slots}人</span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                参加すると <span className="font-bold">{app.tester_reward_points}pt</span> 獲得できます
              </p>
            </div>
            {!isOwner && (
              application ? (
                <span className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium ${application.status === "pending" ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300" : application.status === "approved" ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
                  {application.status === "pending" ? "申請済み" : application.status === "approved" ? "承認済み ✓" : "見送り"}
                </span>
              ) : (
                <button onClick={() => setApplyOpen(true)}
                  disabled={totalApplicants >= app.tester_slots}
                  className="flex-shrink-0 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {totalApplicants >= app.tester_slots ? "満員" : "参加申請する"}
                </button>
              )
            )}
          </div>

          {/* Apply form */}
          {applyOpen && (
            <form onSubmit={handleApply} className="mt-4 space-y-3">
              <textarea
                value={applyMsg}
                onChange={(e) => setApplyMsg(e.target.value)}
                rows={3}
                placeholder="自己紹介や参加理由（任意）"
                className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setApplyOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  キャンセル
                </button>
                <button type="submit" disabled={applying}
                  className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {applying ? "申請中..." : "申請する"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* YouTube */}
      {youtubeId && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">デモ動画</h2>
          <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: "56.25%" }}>
            <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube.com/embed/${youtubeId}`} title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        </div>
      )}

      {/* Screenshots */}
      {shots.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">スクリーンショット</h2>
          <div className="rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 mb-2">
            <img src={shots[activeShot]} alt={`screenshot ${activeShot + 1}`} className="w-full object-contain max-h-80" />
          </div>
          {shots.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {shots.map((src, i) => (
                <button key={i} onClick={() => setActiveShot(i)}
                  className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${i === activeShot ? "border-zinc-900 dark:border-white" : "border-transparent"}`}>
                  <img src={src} alt={`thumb ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {app.description && (
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">About</h2>
          <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{app.description}</p>
        </div>
      )}

      {/* Comments */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">コメント（{comments.length}）</h2>
        <div className="space-y-4 mb-6">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-medium flex-shrink-0">
                {(commentProfiles[c.user_id] ?? "?")[0].toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">{commentProfiles[c.user_id] ?? "anonymous"}</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{(c as { content: string }).content}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && <p className="text-sm text-zinc-400">コメントはまだありません</p>}
        </div>
        <form onSubmit={handleComment} className="flex gap-2">
          <input type="text" value={comment} onChange={(e) => setComment(e.target.value)}
            placeholder={user ? "コメントを書く..." : "ログインしてコメント"} disabled={!user}
            className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50" />
          <button type="submit" disabled={!user || submitting || !comment.trim()}
            className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-40">
            送信
          </button>
        </form>
      </div>
    </div>
  );
}
