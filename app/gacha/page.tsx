"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const GACHA_STYLE = `
@keyframes spin-capsule {
  0%   { transform: rotate(0deg) scale(1); }
  25%  { transform: rotate(90deg) scale(1.15); }
  50%  { transform: rotate(180deg) scale(1); }
  75%  { transform: rotate(270deg) scale(1.15); }
  100% { transform: rotate(360deg) scale(1); }
}
@keyframes dot-bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40%            { transform: translateY(-8px); opacity: 1; }
}
@keyframes reveal-card {
  0%   { transform: scale(0.4) rotateY(90deg); opacity: 0; }
  60%  { transform: scale(1.08) rotateY(-5deg); opacity: 1; }
  80%  { transform: scale(0.97) rotateY(2deg); }
  100% { transform: scale(1) rotateY(0deg); opacity: 1; }
}
@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
  30%, 70%  { opacity: 1; transform: scale(1) rotate(180deg); }
}
@keyframes legendary-glow {
  0%, 100% { box-shadow: 0 0 24px 4px rgba(234,179,8,0.5), 0 0 0 2px rgba(234,179,8,0.3); }
  50%       { box-shadow: 0 0 60px 16px rgba(234,179,8,0.8), 0 0 0 4px rgba(234,179,8,0.5); }
}
@keyframes epic-glow {
  0%, 100% { box-shadow: 0 0 20px 4px rgba(168,85,247,0.4); }
  50%       { box-shadow: 0 0 48px 12px rgba(168,85,247,0.7); }
}
@keyframes rare-glow {
  0%, 100% { box-shadow: 0 0 16px 4px rgba(96,165,250,0.4); }
  50%       { box-shadow: 0 0 36px 10px rgba(96,165,250,0.6); }
}
.spin-capsule { animation: spin-capsule 0.7s linear infinite; display: inline-block; }
.dot-bounce   { animation: dot-bounce 1.2s ease-in-out infinite; }
.reveal-card  { animation: reveal-card 0.6s cubic-bezier(0.34,1.56,0.64,1) both; }
.sparkle-anim { animation: sparkle 1.4s ease-in-out infinite; }
.legendary-glow { animation: legendary-glow 1.5s ease-in-out infinite; }
.epic-glow      { animation: epic-glow 1.5s ease-in-out infinite; }
.rare-glow      { animation: rare-glow 1.5s ease-in-out infinite; }
`;

const SPARKLE_POSITIONS = [
  { top: "8%",  left: "12%",  delay: "0s",    size: "text-2xl" },
  { top: "15%", right: "10%", delay: "0.3s",  size: "text-lg" },
  { top: "75%", left: "8%",   delay: "0.5s",  size: "text-xl" },
  { top: "80%", right: "12%", delay: "0.2s",  size: "text-2xl" },
  { top: "45%", left: "4%",   delay: "0.7s",  size: "text-sm" },
  { top: "40%", right: "4%",  delay: "0.4s",  size: "text-xl" },
  { top: "60%", left: "20%",  delay: "0.9s",  size: "text-sm" },
  { top: "25%", right: "22%", delay: "0.6s",  size: "text-lg" },
];

type GachaItem = {
  id: string;
  gacha_type: string;
  category: string;
  name: string;
  value: string;
  icon_url?: string;
  rarity: string;
};

type InventoryItem = {
  id: string;
  item_id: string | null;
  app_id: string | null;
  obtained_at: string;
  aa_gacha_items?: GachaItem;
  aa_apps?: { id: string; name: string; icon_url: string };
};

const RARITY_STYLE: Record<string, string> = {
  common: "border-zinc-300 dark:border-zinc-600",
  rare: "border-blue-400 shadow-blue-200 dark:shadow-blue-900",
  epic: "border-purple-500 shadow-purple-200 dark:shadow-purple-900",
  legendary: "border-yellow-400 shadow-yellow-200 dark:shadow-yellow-900",
  unique: "border-green-400 shadow-green-200 dark:shadow-green-900",
};

const RARITY_LABEL: Record<string, string> = {
  common: "COMMON",
  rare: "RARE",
  epic: "EPIC",
  legendary: "LEGENDARY",
  unique: "UNIQUE",
};

const RARITY_COLOR: Record<string, string> = {
  common: "text-zinc-500",
  rare: "text-blue-500",
  epic: "text-purple-500",
  legendary: "text-yellow-500",
  unique: "text-green-500",
};

const GACHA_INFO = [
  {
    type: "normal",
    name: "ノーマルガチャ",
    cost: 30,
    description: "文字色・アプリカード枠色 全20色",
    icon: "🎨",
    bg: "from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700",
    btnColor: "bg-zinc-700 hover:bg-zinc-600 dark:bg-zinc-300 dark:hover:bg-zinc-200 dark:text-zinc-900",
  },
  {
    type: "super",
    name: "スーパーガチャ",
    cost: 100,
    description: "プロフィール飾りバッジ（レアリティあり）",
    icon: "✨",
    bg: "from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900",
    btnColor: "bg-blue-600 hover:bg-blue-500",
  },
  {
    type: "premium",
    name: "プレミアムガチャ",
    cost: 300,
    description: "投稿順1〜100番目のアプリアイコンカード",
    icon: "👑",
    bg: "from-yellow-50 to-amber-100 dark:from-yellow-950 dark:to-amber-900",
    btnColor: "bg-amber-500 hover:bg-amber-400",
  },
];

export default function GachaPage() {
  const router = useRouter();
  const [userBadge, setUserBadge] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [pulling, setPulling] = useState<string | null>(null);
  const [result, setResult] = useState<GachaItem | null>(null);
  const [phase, setPhase] = useState<"idle" | "spinning" | "revealing">("idle");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [tab, setTab] = useState<"gacha" | "inventory">("gacha");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/auth"); return; }
    setAuthToken(session.access_token);

    const { data: profile } = await supabase
      .from("aa_profiles")
      .select("badge")
      .eq("id", session.user.id)
      .single();

    if (profile?.badge !== "master") { router.push("/"); return; }
    setUserBadge(profile.badge);

    await Promise.all([fetchPoints(session.user.id), fetchInventory(session.user.id)]);
    setLoading(false);
  }

  async function fetchPoints(uid: string) {
    const { data } = await supabase.from("aa_points").select("amount").eq("user_id", uid);
    setPoints((data ?? []).reduce((s, r) => s + r.amount, 0));
  }

  async function fetchInventory(uid: string) {
    const { data } = await supabase
      .from("aa_gacha_inventory")
      .select("*, aa_gacha_items(*), aa_apps(id, name, icon_url)")
      .eq("user_id", uid)
      .order("obtained_at", { ascending: false });
    setInventory((data as InventoryItem[]) ?? []);
  }

  async function pullGacha(type: string) {
    if (!authToken || pulling) return;
    setPulling(type);
    setResult(null);
    setPhase("spinning");

    const startTime = Date.now();

    try {
      const res = await fetch("/api/gacha", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "エラーが発生しました");
        setPhase("idle");
        return;
      }

      const elapsed = Date.now() - startTime;
      if (elapsed < 1600) {
        await new Promise((r) => setTimeout(r, 1600 - elapsed));
      }

      setResult(data.item);
      setPhase("revealing");

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetchPoints(session.user.id);
        await fetchInventory(session.user.id);
      }
    } finally {
      setPulling(null);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-zinc-400">読み込み中...</div>;
  }

  if (!userBadge) return null;

  const badgeInventory = inventory.filter((i) => i.aa_gacha_items?.category === "badge");
  const colorInventory = inventory.filter((i) => i.aa_gacha_items?.category === "color");
  const appInventory = inventory.filter((i) => i.app_id);

  const glowClass =
    result?.rarity === "legendary" ? "legendary-glow" :
    result?.rarity === "epic" ? "epic-glow" :
    result?.rarity === "rare" ? "rare-glow" : "";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <style>{GACHA_STYLE}</style>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">ガチャ</h1>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <span className="text-sm text-zinc-500">所持ポイント</span>
          <span className="font-bold text-lg">{points.toLocaleString()} pt</span>
        </div>
      </div>

      {/* タブ */}
      <div className="flex gap-2 mb-6">
        {(["gacha", "inventory"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
            }`}
          >
            {t === "gacha" ? "ガチャを引く" : `所持アイテム (${inventory.length})`}
          </button>
        ))}
      </div>

      {tab === "gacha" && (
        <div className="space-y-4">
          {GACHA_INFO.map((g) => (
            <div key={g.type} className={`rounded-2xl bg-gradient-to-br ${g.bg} p-5 border border-zinc-200 dark:border-zinc-700`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{g.icon}</span>
                    <h2 className="font-bold text-lg">{g.name}</h2>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{g.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-xl">{g.cost}pt</p>
                </div>
              </div>
              <button
                onClick={() => pullGacha(g.type)}
                disabled={!!pulling || points < g.cost}
                className={`w-full py-2.5 rounded-xl text-white font-medium transition-opacity disabled:opacity-40 ${g.btnColor}`}
              >
                {pulling === g.type ? "🎰 回転中..." : `${g.cost}ptで引く`}
              </button>
            </div>
          ))}

          {/* スピナー */}
          {phase === "spinning" && (
            <div className="rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-10 text-center">
              <div className="spin-capsule text-6xl mb-4">🎰</div>
              <p className="text-zinc-400 text-sm font-medium animate-pulse">ガチャ回転中...</p>
              <div className="flex justify-center gap-2 mt-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-purple-500 dot-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 結果表示 */}
          {phase === "revealing" && result && (
            <div className={`reveal-card rounded-2xl border-2 shadow-lg p-6 text-center relative overflow-hidden ${RARITY_STYLE[result.rarity]} ${glowClass} bg-white dark:bg-zinc-900`}>
              {/* スパークル（epic以上） */}
              {(result.rarity === "legendary" || result.rarity === "epic") && (
                <div className="absolute inset-0 pointer-events-none">
                  {SPARKLE_POSITIONS.map((s, i) => (
                    <span
                      key={i}
                      className={`absolute sparkle-anim ${s.size}`}
                      style={{ top: s.top, left: s.left, right: s.right, animationDelay: s.delay }}
                    >
                      {result.rarity === "legendary" ? "⭐" : "✨"}
                    </span>
                  ))}
                </div>
              )}

              <p className={`text-xs font-bold mb-3 tracking-widest ${RARITY_COLOR[result.rarity]}`}>
                ✦ {RARITY_LABEL[result.rarity]} ✦
              </p>

              {result.category === "app_card" ? (
                <>
                  <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-3 bg-zinc-200">
                    {result.icon_url && <img src={result.icon_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <p className="font-bold text-lg mb-3">{result.name}</p>
                  <Link
                    href={`/apps/${result.value}`}
                    className="inline-block px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium"
                  >
                    アプリを見る
                  </Link>
                </>
              ) : result.category === "color" ? (
                <>
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 border-4 border-white shadow" style={{ backgroundColor: result.value }} />
                  <p className="font-bold text-lg">{result.name}</p>
                  <p className="text-sm text-zinc-400 mt-1">{result.value}</p>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-3">{result.value}</div>
                  <p className="font-bold text-lg">{result.name}</p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "inventory" && (
        <div className="space-y-6">
          {/* カラー */}
          {colorInventory.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-zinc-500 text-sm uppercase tracking-wide">カラー ({colorInventory.length}/20)</h3>
              <div className="flex flex-wrap gap-3">
                {colorInventory.map((i) => (
                  <div key={i.id} className="text-center">
                    <div
                      className="w-10 h-10 rounded-full border-2 border-white shadow"
                      style={{ backgroundColor: i.aa_gacha_items?.value }}
                      title={i.aa_gacha_items?.name}
                    />
                    <p className="text-xs text-zinc-400 mt-1 w-10 truncate">{i.aa_gacha_items?.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* バッジ */}
          {badgeInventory.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-zinc-500 text-sm uppercase tracking-wide">バッジ ({badgeInventory.length}個)</h3>
              <div className="flex flex-wrap gap-2">
                {badgeInventory.map((i) => (
                  <div key={i.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 bg-white dark:bg-zinc-900 ${RARITY_STYLE[i.aa_gacha_items?.rarity ?? "common"]}`}>
                    <span className="text-xl">{i.aa_gacha_items?.value}</span>
                    <span className={`text-xs font-medium ${RARITY_COLOR[i.aa_gacha_items?.rarity ?? "common"]}`}>
                      {i.aa_gacha_items?.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* アプリコレクション */}
          <div>
            <h3 className="font-semibold mb-3 text-zinc-500 text-sm uppercase tracking-wide">
              アプリコレクション ({appInventory.length}/100)
              {appInventory.length === 100 && <span className="ml-2 text-yellow-500">👑 コンプリート!</span>}
            </h3>
            {appInventory.length === 0 ? (
              <p className="text-sm text-zinc-400">プレミアムガチャでアプリを集めよう</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {appInventory.map((i) => (
                  <Link key={i.id} href={`/apps/${i.app_id}`} className="group text-center">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-700 border-2 border-green-400 shadow-sm group-hover:scale-105 transition-transform">
                      {i.aa_apps?.icon_url && (
                        <img src={i.aa_apps.icon_url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 w-14 truncate">{i.aa_apps?.name}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {inventory.length === 0 && (
            <div className="text-center py-12 text-zinc-400">
              <p className="text-4xl mb-3">🎰</p>
              <p>まだアイテムがありません</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
