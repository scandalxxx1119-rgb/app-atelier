"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/" className="px-3 py-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            ホーム
          </Link>
          <Link href="/resources" className="px-3 py-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            About
          </Link>
        </nav>
        <nav className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              <Link
                href="/submit"
                className="px-4 py-1.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:opacity-80 transition-opacity"
              >
                アプリを投稿
              </Link>
              <Link
                href="/profile"
                className="px-3 py-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                マイページ
              </Link>
              <button
                onClick={() => supabase.auth.signOut()}
                className="px-3 py-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                ログアウト
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="px-4 py-1.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:opacity-80 transition-opacity"
            >
              ログイン
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
