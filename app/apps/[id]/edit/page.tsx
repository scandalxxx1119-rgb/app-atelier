"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PLATFORM_TAGS, CATEGORY_TAGS } from "@/lib/tags";
import { validateImageFile } from "@/lib/sanitize";
import type { User } from "@supabase/supabase-js";

async function uploadImage(file: File, path: string): Promise<string> {
  const { error } = await supabase.storage.from("aa-apps").upload(path, file, { upsert: true });
  if (error) throw error;
  return supabase.storage.from("aa-apps").getPublicUrl(path).data.publicUrl;
}

const STATUS_OPTIONS = [
  { value: "released", label: "リリース済み" },
  { value: "beta", label: "ベータ版" },
  { value: "dev", label: "開発中" },
];

export default function EditAppPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
  const [testerSlots, setTesterSlots] = useState(5);
  const [testerPoints, setTesterPoints] = useState(10);

  const [iconPreview, setIconPreview] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
  const [screenshotFiles, setScreenshotFiles] = useState<(File | null)[]>([]);

  const iconRef = useRef<HTMLInputElement>(null);
  const screenshotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth"); return; }
      setUser(data.user);

      const { data: app } = await supabase.from("aa_apps").select("*").eq("id", id).single();
      if (!app || app.user_id !== data.user.id) { router.push("/"); return; }

      setName(app.name ?? "");
      setTagline(app.tagline ?? "");
      setDescription(app.description ?? "");
      setUrl(app.url ?? "");
      setAppStoreUrl(app.app_store_url ?? "");
      setPlayStoreUrl(app.play_store_url ?? "");
      setGithubUrl(app.github_url ?? "");
      setTwitterUrl(app.twitter_url ?? "");
      setYoutubeUrl(app.youtube_url ?? "");
      setSelectedTags(app.tags ?? []);
      setStatus(app.status ?? "released");
      setTesterEnabled((app.tester_slots ?? 0) > 0);
      setTesterSlots(app.tester_slots > 0 ? app.tester_slots : 5);
      setTesterPoints(app.tester_reward_points > 0 ? app.tester_reward_points : 10);
      setIconPreview(app.icon_url ?? "");
      setScreenshotPreviews(app.screenshot_urls ?? []);
      setScreenshotFiles((app.screenshot_urls ?? []).map(() => null));
      setLoading(false);
    });
  }, [id, router]);

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

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
    const combined = [...screenshotFiles, ...newFiles.map(f => f as File | null)].slice(0, 5);
    setScreenshotFiles(combined);
    setScreenshotPreviews(combined.map((f, i) => f ? URL.createObjectURL(f) : screenshotPreviews[i] ?? ""));
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
      let iconUrl = iconPreview;
      if (iconFile) {
        const ext = iconFile.name.split(".").pop();
        iconUrl = await uploadImage(iconFile, `${user.id}/icons/${Date.now()}.${ext}`);
      }

      const finalScreenshots: string[] = [];
      for (let i = 0; i < screenshotFiles.length; i++) {
        const file = screenshotFiles[i];
        if (file) {
          const ext = file.name.split(".").pop();
          const uploaded = await uploadImage(file, `${user.id}/screenshots/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`);
          finalScreenshots.push(uploaded);
        } else {
          finalScreenshots.push(screenshotPreviews[i]);
        }
      }

      const { error } = await supabase.from("aa_apps").update({
        name, tagline, description,
        url: url || null,
        app_store_url: appStoreUrl || null,
        play_store_url: playStoreUrl || null,
        github_url: githubUrl || null,
        twitter_url: twitterUrl || null,
        youtube_url: youtubeUrl || null,
        icon_url: iconUrl || null,
        screenshot_urls: finalScreenshots.length > 0 ? finalScreenshots : null,
        tags: selectedTags.length > 0 ? selectedTags : null,
        status,
        tester_slots: testerEnabled ? testerSlots : 0,
        tester_reward_points: testerEnabled ? testerPoints : 0,
      }).eq("id", id).eq("user_id", user.id);

      if (error) throw error;
      router.push(`/apps/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setSubmitting(false);
    }
  };

  if (loading) return null;

  const inputCls = "w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 text-sm";

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-8">アプリを編集</h1>
      <form onSubmit={handleSubmit} className="space-y-7">

        {/* Icon */}
        <div>
          <label className="block text-sm font-medium mb-2">アイコン</label>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => iconRef.current?.click()}
              className="w-20 h-20 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 transition-colors overflow-hidden flex items-center justify-center">
              {iconPreview ? <img src={iconPreview} alt="icon" className="w-full h-full object-cover" /> : <span className="text-3xl text-zinc-300">+</span>}
            </button>
            <input ref={iconRef} type="file" accept="image/*" onChange={handleIconChange} className="hidden" />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-2">ステータス</label>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button key={opt.value} type="button" onClick={() => setStatus(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${status === opt.value ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Basic */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">アプリ名 *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required maxLength={50} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">キャッチコピー *</label>
            <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} required maxLength={100} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">説明</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={`${inputCls} resize-none`} />
          </div>
        </div>

        {/* Screenshots */}
        <div>
          <label className="block text-sm font-medium mb-2">スクリーンショット（最大5枚）</label>
          <div className="flex flex-wrap gap-2">
            {screenshotPreviews.map((src, i) => (
              <div key={i} className="relative w-24 h-16">
                <img src={src} alt={`ss${i}`} className="w-full h-full object-cover rounded-lg" />
                <button type="button" onClick={() => removeScreenshot(i)}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs flex items-center justify-center">×</button>
              </div>
            ))}
            {screenshotPreviews.length < 5 && (
              <button type="button" onClick={() => screenshotRef.current?.click()}
                className="w-24 h-16 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 transition-colors flex items-center justify-center text-zinc-300 text-2xl">+</button>
            )}
          </div>
          <input ref={screenshotRef} type="file" accept="image/*" multiple onChange={handleScreenshotsChange} className="hidden" />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-3">タグ{selectedTags.length > 0 && <span className="text-zinc-400 font-normal ml-1">({selectedTags.length}個)</span>}</label>
          <p className="text-xs text-zinc-400 mb-2">プラットフォーム</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {PLATFORM_TAGS.map((tag) => (
              <button key={tag} type="button" onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedTags.includes(tag) ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}>{tag}</button>
            ))}
          </div>
          <p className="text-xs text-zinc-400 mb-2">カテゴリ</p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_TAGS.map((tag) => (
              <button key={tag} type="button" onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedTags.includes(tag) ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}>{tag}</button>
            ))}
          </div>
        </div>

        {/* Links */}
        <div>
          <label className="block text-sm font-medium mb-3">ストアリンク</label>
          <div className="space-y-2">
            <div className="flex items-center gap-2"><span className="w-6 text-center">🍎</span><input type="url" value={appStoreUrl} onChange={(e) => setAppStoreUrl(e.target.value)} placeholder="App Store URL" className={inputCls} /></div>
            <div className="flex items-center gap-2"><span className="w-6 text-center">▶</span><input type="url" value={playStoreUrl} onChange={(e) => setPlayStoreUrl(e.target.value)} placeholder="Google Play URL" className={inputCls} /></div>
            <div className="flex items-center gap-2"><span className="w-6 text-center">🌐</span><input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="WebサイトURL" className={inputCls} /></div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-3">SNS・開発リンク</label>
          <div className="space-y-2">
            <div className="flex items-center gap-2"><span className="w-6 text-center font-bold text-sm">𝕏</span><input type="url" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://x.com/yourhandle" className={inputCls} /></div>
            <div className="flex items-center gap-2"><span className="w-6 text-center">📺</span><input type="url" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="YouTube URL" className={inputCls} /></div>
            <div className="flex items-center gap-2"><span className="w-6 text-center">🐙</span><input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="GitHub URL" className={inputCls} /></div>
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
              <p className="text-sm font-medium">テスター募集を有効にする</p>
              <p className="text-xs text-zinc-400">申請したユーザーにポイントを付与できます</p>
            </div>
          </label>

          {testerEnabled && (
            <div className="flex gap-4 pl-7">
              <div className="flex-1">
                <label className="block text-xs font-medium text-zinc-500 mb-1">募集枠数</label>
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
                <label className="block text-xs font-medium text-zinc-500 mb-1">付与ポイント</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={testerPoints}
                  onChange={(e) => setTesterPoints(Number(e.target.value))}
                  className={inputCls}
                />
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            キャンセル
          </button>
          <button type="submit" disabled={submitting}
            className="flex-1 py-2.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:opacity-80 transition-opacity disabled:opacity-50 text-sm">
            {submitting ? "保存中..." : "保存する"}
          </button>
        </div>
      </form>
    </div>
  );
}
