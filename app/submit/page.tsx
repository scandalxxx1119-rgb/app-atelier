"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PLATFORM_TAGS, CATEGORY_TAGS, SPECIAL_TAGS } from "@/lib/tags";
import { isPremiumBadge } from "@/components/Badge";
import { validateImageFile } from "@/lib/sanitize";
import type { User } from "@supabase/supabase-js";

function Tooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
        className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500 text-[10px] flex items-center justify-center cursor-pointer font-bold select-none hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors flex-shrink-0"
      >
        ?
      </button>
      {open && (
        <span className="absolute bottom-full left-0 mb-1.5 w-60 px-3 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-700 text-white text-xs z-20 leading-relaxed shadow-lg whitespace-normal">
          {text}
          <button type="button" onClick={() => setOpen(false)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
        </span>
      )}
    </span>
  );
}

const STATUS_OPTIONS = [
  { value: "released", label: "リリース済み" },
  { value: "beta", label: "ベータ版" },
  { value: "dev", label: "開発中" },
];

async function uploadImage(file: File, path: string): Promise<string> {
  const { error } = await supabase.storage
    .from("aa-apps")
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("aa-apps").getPublicUrl(path);
  return data.publicUrl;
}

export default function SubmitPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [submittedApp, setSubmittedApp] = useState<{ id: string; name: string; tagline: string } | null>(null);

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [appStoreUrl, setAppStoreUrl] = useState("");
  const [playStoreUrl, setPlayStoreUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [status, setStatus] = useState("released");
  const [testerEnabled, setTesterEnabled] = useState(false);
  const [testerSlots, setTesterSlots] = useState(12);
  const [testerPoints, setTesterPoints] = useState(1);

  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState("");
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);

  const iconRef = useRef<HTMLInputElement>(null);
  const screenshotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth"); return; }
      setUser(data.user);
      const { data: profile } = await supabase.from("aa_profiles").select("badge, is_premium, screenshot_extended").eq("id", data.user.id).single();
      setIsPremium(isPremiumBadge(profile?.badge) || profile?.is_premium === true || profile?.screenshot_extended === true);
      setLoading(false);
    });
  }, [router]);

  const maxScreenshots = isPremium ? 10 : 5;

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateImageFile(file, 10);
    if (err) { setError(err); return; }
    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
  };

  const handleScreenshotsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? []).filter((f) => {
      const err = validateImageFile(f, 10);
      if (err) { setError(err); return false; }
      return true;
    });
    const combined = [...screenshotFiles, ...newFiles].slice(0, maxScreenshots);
    setScreenshotFiles(combined);
    setScreenshotPreviews(combined.map((f) => URL.createObjectURL(f)));
  };

  const removeScreenshot = (i: number) => {
    setScreenshotFiles((prev) => prev.filter((_, idx) => idx !== i));
    setScreenshotPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    setSubmitting(true);

    try {
      // URLフィールドのバリデーション
      const urlFields: [string, string][] = [
        [url, "WebサイトURL"],
        [appStoreUrl, "App Store URL"],
        [playStoreUrl, "Google Play URL"],
        [githubUrl, "GitHub URL"],
        [twitterUrl, "X (Twitter) URL"],
        [youtubeUrl, "YouTube URL"],
      ];
      for (const [val, label] of urlFields) {
        if (val && !val.startsWith("http://") && !val.startsWith("https://")) {
          setError(`${label}はhttps://から始まるURLを入力してください`);
          setSubmitting(false);
          return;
        }
      }

      // 投稿数上限チェック（20件まで）
      const { count } = await supabase.from("aa_apps")
        .select("*", { count: "exact", head: true }).eq("user_id", user.id);
      if ((count ?? 0) >= 20) {
        setError("1アカウントあたりの投稿数上限（20件）に達しています");
        setSubmitting(false);
        return;
      }

      // 新規アカウント（登録24時間以内）は1件まで（gold/platinum/master は免除）
      const accountAge = Date.now() - new Date(user.created_at).getTime();
      if (accountAge < 24 * 60 * 60 * 1000 && (count ?? 0) >= 1) {
        const { data: profile } = await supabase.from("aa_profiles")
          .select("badge").eq("id", user.id).single();
        const exemptBadges = ["gold", "platinum", "master"];
        if (!exemptBadges.includes(profile?.badge ?? "")) {
          setError("アカウント登録から24時間以内は1件までしか投稿できません");
          setSubmitting(false);
          return;
        }
      }
      let iconUrl: string | null = null;
      if (iconFile) {
        const ext = iconFile.name.split(".").pop();
        iconUrl = await uploadImage(iconFile, `${user.id}/icons/${Date.now()}.${ext}`);
      }

      const screenshotUrls: string[] = [];
      for (const file of screenshotFiles) {
        const ext = file.name.split(".").pop();
        const uploaded = await uploadImage(
          file,
          `${user.id}/screenshots/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        );
        screenshotUrls.push(uploaded);
      }

      const { data: newApp, error } = await supabase.from("aa_apps").insert({
        user_id: user.id,
        name,
        tagline,
        description,
        url: url || null,
        app_store_url: appStoreUrl || null,
        play_store_url: playStoreUrl || null,
        github_url: githubUrl || null,
        twitter_url: twitterUrl || null,
        youtube_url: youtubeUrl || null,
        icon_url: iconUrl,
        screenshot_urls: screenshotUrls.length > 0 ? screenshotUrls : null,
        tags: selectedTags.length > 0 ? selectedTags : null,
        status,
        tester_slots: testerEnabled ? testerSlots : 0,
        tester_reward_points: testerEnabled ? testerPoints : 0,
      }).select("id").single();

      if (error) throw error;
      setSubmittedApp({ id: newApp.id, name, tagline });
    } catch (err: unknown) {
      const msg = err instanceof Error
        ? err.message
        : (typeof err === "object" && err !== null && "detail" in err)
          ? "セッションが切れました。再度ログインしてください"
          : "エラーが発生しました。時間をおいて再試行してください";
      setError(msg);
      setSubmitting(false);
    }
  };

  if (loading) return null;

  if (submittedApp) {
    const appUrl = `https://app-atelier.vercel.app/apps/${submittedApp.id}`;
    const xText = `【${submittedApp.name}】${submittedApp.tagline}\n\nApp Atelierで公開しました！ぜひチェックしてください✨\n\n#個人開発 #appatelier`;
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-6">🎉</div>
        <h1 className="text-2xl font-bold mb-2">アプリが公開されました！</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">
          「{submittedApp.name}」をApp Atelierに投稿しました。<br />
          Xでシェアしてより多くの人に届けましょう！
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={`https://x.com/intent/tweet?text=${encodeURIComponent(xText)}&url=${encodeURIComponent(appUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:opacity-80 transition-opacity text-sm"
          >
            <span className="font-bold">𝕏</span> Xでシェアする
          </a>
          <button
            onClick={() => router.push(`/apps/${submittedApp.id}`)}
            className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            アプリページを見る
          </button>
        </div>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 underline"
        >
          ホームへ戻る
        </button>
      </div>
    );
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 text-sm";

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-8">アプリを投稿</h1>

      <form onSubmit={handleSubmit} className="space-y-7">
        {/* Icon */}
        <div>
          <label className="block text-sm font-medium mb-2">アイコン</label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => iconRef.current?.click()}
              className="w-20 h-20 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 transition-colors overflow-hidden flex items-center justify-center"
            >
              {iconPreview
                ? <img src={iconPreview} alt="icon" className="w-full h-full object-cover" />
                : <span className="text-3xl text-zinc-300">+</span>}
            </button>
            <p className="text-xs text-zinc-400">PNG / JPG 推奨<br />1024×1024px</p>
            <input ref={iconRef} type="file" accept="image/*" onChange={handleIconChange} className="hidden" />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-2">ステータス</label>
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map((opt) => (
              <button key={opt.value} type="button" onClick={() => setStatus(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${status === opt.value ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Basic info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">アプリ名 *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required maxLength={50} placeholder="My Awesome App" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">キャッチコピー *</label>
            <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} required maxLength={100} placeholder="一言でアプリを説明" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">説明</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={3000} placeholder="アプリの詳細説明..." className={`${inputCls} resize-none`} />
          </div>
        </div>

        {/* Screenshots */}
        <div>
          <label className="block text-sm font-medium mb-2">スクリーンショット（最大{maxScreenshots}枚{isPremium ? "" : " / プレミアムは10枚"}）</label>
          <div className="flex flex-wrap gap-2">
            {screenshotPreviews.map((src, i) => (
              <div key={i} className="relative w-24 h-16">
                <img src={src} alt={`ss${i}`} className="w-full h-full object-cover rounded-lg" />
                <button type="button" onClick={() => removeScreenshot(i)}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs flex items-center justify-center">
                  ×
                </button>
              </div>
            ))}
            {screenshotPreviews.length < maxScreenshots && (
              <button type="button" onClick={() => screenshotRef.current?.click()}
                className="w-24 h-16 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 transition-colors flex items-center justify-center text-zinc-300 text-2xl">
                +
              </button>
            )}
          </div>
          <input ref={screenshotRef} type="file" accept="image/*" multiple onChange={handleScreenshotsChange} className="hidden" />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-3">
            タグ{selectedTags.length > 0 && <span className="text-zinc-400 font-normal ml-1">({selectedTags.length}個)</span>}
          </label>
          <p className="text-xs text-zinc-400 mb-2">特別タグ</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {SPECIAL_TAGS.map((tag) => (
              <button key={tag} type="button" onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedTags.includes(tag) ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}>{tag}</button>
            ))}
          </div>
          <p className="text-xs text-zinc-400 mb-2">プラットフォーム</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {PLATFORM_TAGS.map((tag) => (
              <button key={tag} type="button" onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedTags.includes(tag) ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}>
                {tag}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-400 mb-2">カテゴリ</p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_TAGS.map((tag) => (
              <button key={tag} type="button" onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedTags.includes(tag) ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Store links */}
        <div>
          <label className="block text-sm font-medium mb-3">ストアリンク</label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg w-6 text-center">🍎</span>
              <input type="url" value={appStoreUrl} onChange={(e) => setAppStoreUrl(e.target.value)} placeholder="App Store URL" className={inputCls} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg w-6 text-center">▶</span>
              <input type="url" value={playStoreUrl} onChange={(e) => setPlayStoreUrl(e.target.value)} placeholder="Google Play URL" className={inputCls} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg w-6 text-center">🌐</span>
              <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Webサイト URL" className={inputCls} />
            </div>
          </div>
        </div>

        {/* Social links */}
        <div>
          <label className="block text-sm font-medium mb-3">SNS・開発リンク</label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold w-6 text-center">𝕏</span>
              <input type="url" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://x.com/yourhandle" className={inputCls} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg w-6 text-center">📺</span>
              <input type="url" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className={inputCls} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg w-6 text-center">🐙</span>
              <input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/user/repo" className={inputCls} />
            </div>
          </div>
        </div>

        {/* Tester recruitment */}
        <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={testerEnabled}
              onChange={(e) => setTesterEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium">テスター募集を有効にする</p>
                <Tooltip text="アプリのテスターを募集できます。ユーザーが申請し、あなたが承認するとそのユーザーに自動でポイントが付与されます。テスター管理ページで申請者の承認・拒否を行えます。" />
              </div>
              <p className="text-xs text-zinc-400">申請したユーザーにポイントを付与できます</p>
            </div>
          </label>

          {testerEnabled && (
            <div className="flex gap-4 pl-7">
              <div className="flex-1">
                <label className="flex items-center gap-1 text-xs font-medium text-zinc-500 mb-1">
                  募集枠数
                  <Tooltip text="テスターとして受け入れる最大人数です。満員になると新しい申請ができなくなります。" />
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={testerSlots}
                  onChange={(e) => setTesterSlots(Number(e.target.value))}
                  className={inputCls}
                />
              </div>
              <div className="flex-1">
                <label className="flex items-center gap-1 text-xs font-medium text-zinc-500 mb-1">
                  付与ポイント
                  <Tooltip text="テスターとして承認されたユーザーに付与するポイント数です。ポイントはApp Atelier運営から付与されるものであり、開発者個人が付与するものではありません（1〜5pt）。" />
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={testerPoints}
                  onChange={(e) => setTesterPoints(Number(e.target.value))}
                  className={inputCls}
                />
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* 誓約チェックボックス */}
        <label className="flex items-start gap-3 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 flex-shrink-0 accent-zinc-900 dark:accent-white cursor-pointer"
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            このアプリはマルウェア・詐欺・フィッシング等の悪意ある用途を持たない正当なアプリであることを誓います。また、<a href="/terms" target="_blank" className="underline text-zinc-900 dark:text-zinc-100">利用規約</a>を読み、同意します。
          </span>
        </label>

        <button type="submit" disabled={submitting || !agreed}
          className="w-full py-2.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:opacity-80 transition-opacity disabled:opacity-50">
          {submitting ? "投稿中..." : "投稿する"}
        </button>
      </form>
    </div>
  );
}
