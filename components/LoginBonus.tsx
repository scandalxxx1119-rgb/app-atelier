"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type BonusResult = {
  awarded: boolean;
  points: number;
  bonus: number;
  streak: number;
  total_days: number;
  milestone: number;
};

export default function LoginBonus() {
  const [result, setResult] = useState<BonusResult | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: res } = await supabase.rpc("check_login_bonus");
      if (res && res.awarded) {
        setResult(res as BonusResult);
        setVisible(true);
        setTimeout(() => setVisible(false), 4000);
      }
    });
  }, []);

  if (!visible || !result) return null;

  const isMilestone = result.milestone > 0;
  const totalPt = result.points + result.bonus;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium
        ${isMilestone
          ? "bg-gradient-to-r from-violet-600 to-indigo-600"
          : "bg-zinc-900 dark:bg-zinc-800"
        }`}>
        <span className="text-xl">{isMilestone ? "🎉" : "🎁"}</span>
        <div>
          <p className="font-semibold">
            {isMilestone
              ? `連続${result.milestone}日達成！ +${totalPt}pt`
              : `ログインボーナス +${totalPt}pt`}
          </p>
          <p className="text-xs opacity-80">
            {result.streak}日連続ログイン中（累計{result.total_days}日）
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="ml-2 opacity-60 hover:opacity-100 text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
