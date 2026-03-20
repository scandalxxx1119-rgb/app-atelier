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
