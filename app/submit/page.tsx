"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PLATFORM_TAGS, CATEGORY_TAGS } from "@/lib/tags";
import type { User } from "@supabase/supabase-js";

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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [twitterUrl, setTwitterUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string>("");
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);

  const iconRef = useRef<HTMLInputElement>(null);
  const screenshotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/auth");
      else {
        setUser(data.user);
        setLoading(false);
      }
    });
  }, [router]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
  };

  const handleScreenshotsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    setScreenshotFiles(files);
    setScreenshotPreviews(files.map((f) => URL.createObjectURL(f)));
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
      let iconUrl: string | null = null;
      if (iconFile) {
        const ext = iconFile.name.split(".").pop();
        iconUrl = await uploadImage(
          iconFile,
          `${user.id}/icons/${Date.now()}.${ext}`
        );
      }

      const screenshotUrls: string[] = [];
      for (const file of screenshotFiles) {
        const ext = file.name.split(".").pop();
        const uploaded = await uploadImage(
          file,
          `${user.id}/screenshots/${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}.${ext}`
        );
        screenshotUrls.push(uploaded);
      }

      const { error } = await supabase.from("aa_apps").insert({
        user_id: user.id,
        name,
        tagline,
        description,
        url: url || null,
        icon_url: iconUrl,
        screenshot_urls: screenshotUrls.length > 0 ? screenshotUrls : null,
        tags: selectedTags.length > 0 ? selectedTags : null,
        twitter_url: twitterUrl || null,
        youtube_url: youtubeUrl || null,
      });

      if (error) throw error;
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-8">アプリを投稿</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Icon */}
        <div>
          <label className="block text-sm font-medium mb-2">アイコン</label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => iconRef.current?.click()}
              className="w-20 h-20 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 transition-colors overflow-hidden flex items-center justify-center"
            >
              {iconPreview ? (
                <img src={iconPreview} alt="icon" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-zinc-300">+</span>
              )}
            </button>
            <p className="text-xs text-zinc-400">PNG / JPG 推奨</p>
            <input ref={iconRef} type="file" accept="image/*" onChange={handleIconChange} className="hidden" />
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">アプリ名 *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={50}
            placeholder="My Awesome App"
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>

        {/* Tagline */}
        <div>
          <label className="block text-sm font-medium mb-1">キャッチコピー *</label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            required
            maxLength={100}
            placeholder="一言でアプリを説明"
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">説明</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="アプリの詳細説明..."
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none"
          />
        </div>

        {/* Screenshots */}
        <div>
          <label className="block text-sm font-medium mb-2">スクリーンショット（最大5枚）</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {screenshotPreviews.map((src, i) => (
              <div key={i} className="relative w-24 h-16">
                <img src={src} alt={`ss${i}`} className="w-full h-full object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => removeScreenshot(i)}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
            {screenshotPreviews.length < 5 && (
              <button
                type="button"
                onClick={() => screenshotRef.current?.click()}
                className="w-24 h-16 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 transition-colors flex items-center justify-center text-zinc-300 text-2xl"
              >
                +
              </button>
            )}
          </div>
          <input ref={screenshotRef} type="file" accept="image/*" multiple onChange={handleScreenshotsChange} className="hidden" />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-3">
            タグ{" "}
            {selectedTags.length > 0 && (
              <span className="text-zinc-400 font-normal">（{selectedTags.length}個選択中）</span>
            )}
          </label>

          <p className="text-xs text-zinc-400 mb-2">プラットフォーム</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {PLATFORM_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <p className="text-xs text-zinc-400 mb-2">カテゴリ</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* App URL */}
        <div>
          <label className="block text-sm font-medium mb-1">アプリURL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-app.com"
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>

        {/* Social links */}
        <div className="space-y-3">
          <p className="text-sm font-medium">SNS・メディアリンク</p>
          <div className="flex items-center gap-2">
            <span className="w-6 text-center font-bold text-sm">𝕏</span>
            <input
              type="url"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              placeholder="https://x.com/yourhandle"
              className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 text-center text-sm">▶</span>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {submitting ? "投稿中..." : "投稿する"}
        </button>
      </form>
    </div>
  );
}
