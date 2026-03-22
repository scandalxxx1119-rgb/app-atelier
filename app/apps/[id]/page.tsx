"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Badge from "@/components/Badge";
import { safeUrl } from "@/lib/sanitize";
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

type AppUpdate = {
  id: string;
  version: string | null;
  title: string;
  content: string | null;
  created_at: string;
  user_id: string;
};

type RelatedApp = { id: string; name: string; tagline: string; icon_url: string | null; likes_count: number };

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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [applyMsg, setApplyMsg] = useState("");
  const [applyOpen, setApplyOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [totalApplicants, setTotalApplicants] = useState(0);
  const [deletingComment, setDeletingComment] = useState<string | null>(null);
  const [rewardingComment, setRewardingComment] = useState<string | null>(null);
  const [rewardedComments, setRewardedComments] = useState<Set<string>>(new Set());
  const [isBoosted, setIsBoosted] = useState(false);
  const [boosting, setBoosting] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [hasShared, setHasShared] = useState(false);
  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateVersion, setUpdateVersion] = useState("");
  const [updateContent, setUpdateContent] = useState("");
  const [updateFormOpen, setUpdateFormOpen] = useState(false);
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [relatedApps, setRelatedApps] = useState<RelatedApp[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportDone, setReportDone] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // アプリ取得（joinなし）
    supabase.from("aa_apps").select("*").eq("id", id).eq("is_hidden", false).single()
      .then(({ data }) => {
        if (!data) { router.push("/"); return; }
        setApp(data as App);
        // 開発者プロフィールを別途取得
        supabase.from("aa_profiles").select("id, username, badge, avatar_url")
          .eq("id", data.user_id).single()
          .then(({ data: p }) => { if (p) setDeveloper(p as Profile); });
        // 関連アプリ（同じタグを持つアプリ、非表示除く）
        if (data.tags && data.tags.length > 0) {
          supabase.from("aa_apps")
            .select("id, name, tagline, icon_url, likes_count")
            .overlaps("tags", data.tags)
            .neq("id", id)
            .eq("is_hidden", false)
            .order("likes_count", { ascending: false })
            .limit(4)
            .then(({ data: related }) => { if (related) setRelatedApps(related as RelatedApp[]); });
        }
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

    // アップデート
    supabase.from("aa_app_updates").select("*").eq("app_id", id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setUpdates(data as AppUpdate[]); });

    // ブースト状態
    supabase.from("aa_boosts").select("id").eq("app_id", id)
      .gt("expires_at", new Date().toISOString()).maybeSingle()
      .then(({ data }) => { if (data) setIsBoosted(true); });
  }, [id]);

  useEffect(() => {
    if (!user) return;
    supabase.from("aa_likes").select("id").eq("app_id", id).eq("user_id", user.id)
      .maybeSingle().then(({ data }) => setLiked(!!data));
    supabase.from("aa_tester_applications").select("*").eq("app_id", id).eq("user_id", user.id)
      .maybeSingle().then(({ data }) => setApplication(data as Application | null));

    // ユーザーポイント合計
    supabase.from("aa_points").select("amount").eq("user_id", user.id)
      .then(({ data }) => {
        const total = (data ?? []).reduce((sum: number, r: { amount: number }) => sum + r.amount, 0);
        setUserPoints(total);
      });
    // シェア済み確認
    supabase.from("aa_points").select("id").eq("user_id", user.id).eq("app_id", id).eq("reason", "Xでシェア").maybeSingle()
      .then(({ data }) => setHasShared(!!data));
  }, [user, id]);

  const handleLike = async () => {
    if (!user) { router.push("/auth"); return; }
    if (app && user.id === app.user_id) return; // 自分のアプリはいいね不可
    if (liked) {
      await supabase.from("aa_likes").delete().eq("app_id", id).eq("user_id", user.id);
      setLiked(false);
      setApp((a) => a ? { ...a, likes_count: Math.max(0, a.likes_count - 1) } : a);
    } else {
      await supabase.from("aa_likes").insert({ app_id: id, user_id: user.id });
      setLiked(true);
      setApp((a) => a ? { ...a, likes_count: a.likes_count + 1 } : a);
      // いいねした人に+1pt
      await supabase.from("aa_points").insert({ user_id: user.id, amount: 1, reason: `「${app?.name}」にいいね`, app_id: id });
      // いいねされた開発者に+1pt
      if (app) {
        await supabase.from("aa_points").insert({ user_id: app.user_id, amount: 1, reason: `「${app.name}」がいいねされた`, app_id: id });
      }
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !comment.trim()) return;
    if (comment.trim().length > 500) {
      alert("コメントは500文字以内で入力してください");
      return;
    }
    setSubmitting(true);

    // 1分以内の連投チェック
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count } = await supabase.from("aa_comments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id).gte("created_at", oneMinuteAgo);
    if ((count ?? 0) >= 1) {
      alert("コメントは1分に1回までです");
      setSubmitting(false);
      return;
    }

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
    if (app && user.id === app.user_id) return; // 自分のアプリには申請不可
    setApplying(true);
    const { data } = await supabase.from("aa_tester_applications")
      .insert({ app_id: id, user_id: user.id, message: applyMsg.trim() || null })
      .select("*").single();
    if (data) {
      setApplication(data as Application);
      setTotalApplicants((n) => n + 1);
      // ポイントは承認時に付与（testers/page.tsxで処理）
    }
    setApplyOpen(false);
    setApplying(false);
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !updateTitle.trim()) return;
    if (updateTitle.trim().length > 100) {
      alert("タイトルは100文字以内にしてください");
      return;
    }
    if (updateContent.trim().length > 2000) {
      alert("内容は2000文字以内にしてください");
      return;
    }
    setPostingUpdate(true);
    const { data } = await supabase.from("aa_app_updates").insert({
      app_id: id,
      user_id: user.id,
      title: updateTitle.trim(),
      version: updateVersion.trim() || null,
      content: updateContent.trim() || null,
    }).select("*").single();
    if (data) {
      setUpdates((prev) => [data as AppUpdate, ...prev]);
      setUpdateTitle("");
      setUpdateVersion("");
      setUpdateContent("");
      setUpdateFormOpen(false);
      // アップデート投稿で+5pt
      await supabase.from("aa_points").insert({ user_id: user.id, amount: 5, reason: `「${app?.name}」のアップデートを投稿`, app_id: id });
      setUserPoints((p) => p + 5);
    }
    setPostingUpdate(false);
  };

  const handleDeleteUpdate = async (updateId: string) => {
    if (!user) return;
    await supabase.from("aa_app_updates").delete().eq("id", updateId).eq("user_id", user.id);
    setUpdates((prev) => prev.filter((u) => u.id !== updateId));
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    setDeletingComment(commentId);
    await supabase.from("aa_comments").delete().eq("id", commentId).eq("user_id", user.id);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setDeletingComment(null);
  };

  const handleRewardComment = async (commentUserId: string, commentId: string, amount: number) => {
    if (!user || !app) return;
    setRewardingComment(commentId);
    // DB側で既払いチェック（ページリロードによる多重付与を防止）
    const { count } = await supabase.from("aa_points")
      .select("*", { count: "exact", head: true })
      .eq("user_id", commentUserId)
      .eq("app_id", app.id)
      .eq("reason", `「${app.name}」へのコメント報酬`);
    if ((count ?? 0) === 0) {
      await supabase.from("aa_points").insert({
        user_id: commentUserId,
        amount,
        reason: `「${app.name}」へのコメント報酬`,
        app_id: app.id,
      });
    }
    setRewardedComments((prev) => new Set([...prev, commentId]));
    setRewardingComment(null);
  };

  const BOOST_COST = 50;
  const handleBoost = async () => {
    if (!user || !app) return;
    if (userPoints < BOOST_COST) {
      alert(`ブーストには${BOOST_COST}ptが必要です（現在${userPoints}pt）`);
      return;
    }
    setBoosting(true);
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("aa_boosts").insert({ app_id: app.id, user_id: user.id, expires_at: expiresAt });
    await supabase.from("aa_points").insert({ user_id: user.id, amount: -BOOST_COST, reason: `「${app.name}」をブースト`, app_id: app.id });
    setIsBoosted(true);
    setUserPoints((p) => p - BOOST_COST);
    setBoosting(false);
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

  const handleXShare = async () => {
    const text = `【${app?.name}】${app?.tagline}\n\nApp Atelierで公開中の個人開発アプリです！気になった方はぜひチェックを👀\n\n#個人開発 #appatelier`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, "_blank");
    // 1アプリにつき1回だけ+10pt（自分のアプリは対象外）
    if (user && app && user.id !== app.user_id) {
      const { data: existing } = await supabase.from("aa_points")
        .select("id").eq("user_id", user.id).eq("app_id", app.id).eq("reason", "Xでシェア").maybeSingle();
      if (!existing) {
        await supabase.from("aa_points").insert({ user_id: user.id, amount: 10, reason: "Xでシェア", app_id: app.id });
        setUserPoints((p) => p + 10);
      }
    }
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

  const handleReport = async () => {
    if (!user || !reportReason.trim()) return;
    setReporting(true);
    // 同一ユーザーによる重複通報を防止（自動削除トリガーの悪用対策）
    const { count: existingReports } = await supabase.from("aa_reports")
      .select("*", { count: "exact", head: true })
      .eq("app_id", app.id).eq("reporter_id", user.id);
    if ((existingReports ?? 0) > 0) {
      setReporting(false);
      setReportDone(true);
      setReportReason("");
      return;
    }
    await supabase.from("aa_reports").insert({
      app_id: app.id, reporter_id: user.id, reason: reportReason.trim(),
    });
    setReporting(false);
    setReportDone(true);
    setReportReason("");
  };

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
        {safeUrl(app.app_store_url) && <a href={safeUrl(app.app_store_url)!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 transition-opacity">🍎 App Store</a>}
        {safeUrl(app.play_store_url) && <a href={safeUrl(app.play_store_url)!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 transition-opacity">▶ Google Play</a>}
        {safeUrl(app.url) && <a href={safeUrl(app.url)!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">🌐 Web</a>}
        {safeUrl(app.github_url) && <a href={safeUrl(app.github_url)!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">🐙 GitHub</a>}
        {safeUrl(app.twitter_url) && <a href={safeUrl(app.twitter_url)!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">𝕏 フォロー</a>}
        <div className="flex flex-col items-end gap-1 ml-auto">
          <button onClick={handleXShare} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${hasShared ? "border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950" : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}>
            {hasShared ? "✓ シェア済み" : "𝕏 シェア"}
          </button>
          {!hasShared && user && !isOwner && (
            <span className="text-[10px] text-zinc-400">シェアで+10pt（1回限り）</span>
          )}
        </div>
        <button onClick={handleShare} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">{copied ? "✓ コピー済み" : "🔗 リンク"}</button>
        {isOwner && (
          isBoosted ? (
            <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-500 text-sm font-medium">
              🚀 ブースト中
            </span>
          ) : (
            <button onClick={handleBoost} disabled={boosting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950 text-sm font-medium transition-colors disabled:opacity-50">
              {boosting ? "処理中..." : `🚀 ブースト (${BOOST_COST}pt・3日間)`}
            </button>
          )
        )}
        {user && !isOwner && (
          <button onClick={() => { setReportOpen(true); setReportDone(false); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900 transition-colors">
            🚩 通報
          </button>
        )}
      </div>

      {/* 通報モーダル */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setReportOpen(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-base mb-1">このアプリを通報する</h3>
            <p className="text-xs text-zinc-400 mb-4">運営が確認の上、対応します。</p>
            {reportDone ? (
              <div className="text-center py-4">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">✓ 通報を受け付けました</p>
                <button onClick={() => setReportOpen(false)} className="mt-4 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium">閉じる</button>
              </div>
            ) : (
              <>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="通報理由を入力してください（例：詐欺アプリ、マルウェアが含まれる等）"
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm bg-zinc-50 dark:bg-zinc-800 resize-none h-24 focus:outline-none"
                />
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setReportOpen(false)}
                    className="flex-1 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm">キャンセル</button>
                  <button onClick={handleReport} disabled={!reportReason.trim() || reporting}
                    className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium disabled:opacity-50">
                    {reporting ? "送信中..." : "通報する"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
          <div className="rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 mb-2 cursor-zoom-in relative group"
            onClick={() => setLightboxOpen(true)}>
            <img src={shots[activeShot]} alt={`screenshot ${activeShot + 1}`} className="w-full object-contain max-h-80" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
              <span className="bg-black/50 text-white text-xs px-3 py-1.5 rounded-full">タップで拡大</span>
            </div>
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

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            ×
          </button>
          {shots.length > 1 && (
            <>
              <button
                className="absolute left-4 text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                onClick={(e) => { e.stopPropagation(); setActiveShot((i) => (i - 1 + shots.length) % shots.length); }}>
                ‹
              </button>
              <button
                className="absolute right-4 text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                onClick={(e) => { e.stopPropagation(); setActiveShot((i) => (i + 1) % shots.length); }}>
                ›
              </button>
            </>
          )}
          <img
            src={shots[activeShot]}
            alt={`screenshot ${activeShot + 1}`}
            className="max-w-full max-h-full object-contain px-16"
            onClick={(e) => e.stopPropagation()}
          />
          {shots.length > 1 && (
            <div className="absolute bottom-4 flex gap-1.5">
              {shots.map((_, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setActiveShot(i); }}
                  className={`w-2 h-2 rounded-full transition-colors ${i === activeShot ? "bg-white" : "bg-white/40"}`} />
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

      {/* Updates */}
      {(updates.length > 0 || isOwner) && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
              アップデート（{updates.length}）
            </h2>
            {isOwner && !updateFormOpen && (
              <button onClick={() => setUpdateFormOpen(true)}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700 px-3 py-1 rounded-lg transition-colors">
                + 投稿する
              </button>
            )}
          </div>

          {updateFormOpen && (
            <form onSubmit={handlePostUpdate} className="mb-6 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 space-y-3">
              <div className="flex gap-2">
                <input type="text" value={updateVersion} onChange={(e) => setUpdateVersion(e.target.value)}
                  placeholder="v1.2.0（任意）"
                  className="w-28 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
                <input type="text" value={updateTitle} onChange={(e) => setUpdateTitle(e.target.value)}
                  placeholder="タイトル（例: バグ修正・新機能追加）" required
                  className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
              </div>
              <textarea value={updateContent} onChange={(e) => setUpdateContent(e.target.value)}
                rows={3} placeholder="変更内容の詳細（任意）"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none" />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setUpdateFormOpen(false)}
                  className="px-4 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
                  キャンセル
                </button>
                <button type="submit" disabled={postingUpdate || !updateTitle.trim()}
                  className="px-4 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-40">
                  {postingUpdate ? "投稿中..." : "投稿する"}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {updates.map((u) => (
              <div key={u.id} className="flex gap-3 group">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600 mt-1.5 flex-shrink-0" />
                  <div className="w-px flex-1 bg-zinc-100 dark:bg-zinc-800 mt-1" />
                </div>
                <div className="pb-4 flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {u.version && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {u.version}
                      </span>
                    )}
                    <span className="text-sm font-semibold">{u.title}</span>
                    <span className="text-xs text-zinc-400 ml-auto">
                      {new Date(u.created_at).toLocaleDateString("ja-JP")}
                    </span>
                    {isOwner && (
                      <button onClick={() => handleDeleteUpdate(u.id)}
                        className="opacity-0 group-hover:opacity-100 text-xs text-zinc-400 hover:text-red-500 transition-all">
                        削除
                      </button>
                    )}
                  </div>
                  {u.content && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap">{u.content}</p>
                  )}
                </div>
              </div>
            ))}
            {updates.length === 0 && (
              <p className="text-sm text-zinc-400">まだアップデートはありません</p>
            )}
          </div>
        </div>
      )}

      {/* Comments */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">コメント（{comments.length}）</h2>
        <div className="space-y-4 mb-6">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 group">
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-medium flex-shrink-0">
                {(commentProfiles[c.user_id] ?? "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-400 mb-0.5">{commentProfiles[c.user_id] ?? "anonymous"}</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{(c as { content: string }).content}</p>
                {isOwner && c.user_id !== user?.id && (
                  <div className="mt-1 flex items-center gap-1">
                    {rewardedComments.has(c.id) ? (
                      <span className="text-xs text-green-500">pt付与済み</span>
                    ) : (
                      <>
                        <span className="text-xs text-zinc-400">pt付与:</span>
                        {[1, 2, 3].map((pt) => (
                          <button
                            key={pt}
                            onClick={() => handleRewardComment(c.user_id, c.id, pt)}
                            disabled={rewardingComment === c.id}
                            className="px-1.5 py-0.5 text-xs rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-100 dark:hover:bg-amber-900 text-zinc-500 hover:text-amber-600 transition-colors disabled:opacity-50"
                          >
                            +{pt}pt
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
              {user?.id === c.user_id && (
                <button
                  onClick={() => handleDeleteComment(c.id)}
                  disabled={deletingComment === c.id}
                  className="opacity-0 group-hover:opacity-100 text-xs text-zinc-400 hover:text-red-500 transition-all flex-shrink-0 disabled:opacity-50"
                >
                  削除
                </button>
              )}
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

      {/* 関連アプリ */}
      {relatedApps.length > 0 && (
        <div className="mt-12 pt-8 border-t border-zinc-100 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">関連アプリ</h2>
          <div className="grid grid-cols-2 gap-3">
            {relatedApps.map((a) => (
              <Link key={a.id} href={`/apps/${a.id}`}
                className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
                {a.icon_url ? (
                  <img src={a.icon_url} alt={a.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-base font-bold text-zinc-400 flex-shrink-0">
                    {a.name[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{a.name}</p>
                  <p className="text-xs text-zinc-400 line-clamp-2">{a.tagline}</p>
                  <p className="text-xs text-zinc-400 mt-1">♥ {a.likes_count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
