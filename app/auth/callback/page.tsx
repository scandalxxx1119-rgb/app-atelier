"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      router.push("/auth");
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(async ({ data, error }) => {
      if (error || !data.user) {
        router.push("/auth?error=1");
        return;
      }
      // プロフィールがなければ作成
      await supabase.from("aa_profiles").upsert(
        { id: data.user.id, username: data.user.email?.split("@")[0] ?? "user" },
        { onConflict: "id" }
      );
      router.push("/");
    });
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-zinc-400 text-sm">認証処理中...</p>
    </div>
  );
}
