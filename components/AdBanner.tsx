"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const PREMIUM_BADGES = new Set(["master", "platinum"]);

export default function AdBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        setShow(true);
        return;
      }
      const { data: profile } = await supabase
        .from("aa_profiles")
        .select("badge")
        .eq("id", data.user.id)
        .single();
      setShow(!PREMIUM_BADGES.has(profile?.badge ?? ""));
    });
  }, []);

  useEffect(() => {
    if (!show) return;
    try {
      // @ts-expect-error adsbygoogle is injected by AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [show]);

  if (!show) return null;

  return (
    <div className="w-full border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2">
      <div className="max-w-5xl mx-auto px-4">
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-2430173689245327"
          data-ad-slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT ?? ""}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
