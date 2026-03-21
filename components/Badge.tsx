type BadgeType = "master" | "platinum" | "gold" | "silver" | "bronze" | null | undefined;

const BADGE_CONFIG = {
  master: {
    label: "MASTER",
    className: "bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 text-white",
  },
  platinum: {
    label: "PLATINUM",
    className: "bg-gradient-to-r from-sky-300 via-cyan-200 to-indigo-300 text-zinc-800",
  },
  gold: {
    label: "GOLD",
    className: "bg-gradient-to-r from-yellow-400 to-amber-500 text-white",
  },
  silver: {
    label: "SILVER",
    className: "bg-gradient-to-r from-zinc-300 to-zinc-400 text-zinc-800",
  },
  bronze: {
    label: "BRONZE",
    className: "bg-gradient-to-r from-amber-600 to-orange-700 text-white",
  },
};

export type { BadgeType };

export function isPremiumBadge(badge: BadgeType): boolean {
  return badge === "master" || badge === "platinum" || badge === "gold";
}

export default function Badge({
  badge,
  size = "sm",
}: {
  badge: BadgeType;
  size?: "sm" | "xs";
}) {
  if (!badge || !BADGE_CONFIG[badge]) return null;
  const { label, className } = BADGE_CONFIG[badge];

  return (
    <span
      className={`inline-flex items-center font-bold tracking-widest rounded-full ${className} ${
        size === "xs"
          ? "px-1.5 py-0.5 text-[9px]"
          : "px-2 py-0.5 text-[10px]"
      }`}
    >
      {label}
    </span>
  );
}

// 開発者バッジ（アプリ投稿数）
export function getDevBadgeLevel(appCount: number): number {
  if (appCount >= 15) return 4;
  if (appCount >= 7) return 3;
  if (appCount >= 3) return 2;
  if (appCount >= 1) return 1;
  return 0;
}

export function DevBadge({ appCount, size = "sm" }: { appCount: number; size?: "sm" | "xs" }) {
  const level = getDevBadgeLevel(appCount);
  if (level === 0) return null;
  const colors = ["", "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700", "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700", "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700", "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"];
  return (
    <span className={`inline-flex items-center gap-0.5 font-bold rounded-md ${colors[level]} ${size === "xs" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"}`}>
      📱 Lv.{level}
    </span>
  );
}

// テスターバッジ（承認数＋高評価コメント報酬合計）
export function getTesterBadgeLevel(score: number): number {
  if (score >= 30) return 4;
  if (score >= 15) return 3;
  if (score >= 5) return 2;
  if (score >= 1) return 1;
  return 0;
}

export function TesterBadge({ score, size = "sm" }: { score: number; size?: "sm" | "xs" }) {
  const level = getTesterBadgeLevel(score);
  if (level === 0) return null;
  const stars = "★".repeat(level);
  const borderColors = ["", "border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-300", "border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-300", "border-indigo-400 dark:border-indigo-600 text-indigo-600 dark:text-indigo-300", "border-purple-400 dark:border-purple-600 text-purple-600 dark:text-purple-300"];
  return (
    <span className={`inline-flex items-center gap-0.5 font-bold rounded-full border-2 bg-transparent ${borderColors[level]} ${size === "xs" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"}`}>
      🧪 {stars}
    </span>
  );
}
