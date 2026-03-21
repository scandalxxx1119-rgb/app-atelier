"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  const navLink = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`px-3 py-1.5 text-xs whitespace-nowrap transition-colors rounded-md ${
          active
            ? "text-zinc-900 dark:text-white font-semibold"
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <nav className="flex items-center gap-1 text-xs">
          {navLink("/", "ホーム")}
          {navLink("/resources", "About")}
        </nav>
        <nav className="flex items-center gap-1 text-xs">
          {user ? (
            <>
              <Link
                href="/submit"
                className={`px-4 py-1.5 rounded-full font-medium text-xs whitespace-nowrap transition-all ${
                  pathname === "/submit"
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                    : "border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                アプリを投稿
              </Link>
              <Link
                href="/profile"
                className={`px-3 py-1.5 text-xs whitespace-nowrap transition-colors rounded-md ${
                  pathname === "/profile"
                    ? "text-zinc-900 dark:text-white font-semibold"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                マイページ
              </Link>
              <button
                onClick={() => supabase.auth.signOut()}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap"
              >
                ログアウト
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className={`px-4 py-1.5 rounded-full font-medium text-xs whitespace-nowrap transition-all ${
                pathname === "/auth"
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                  : "border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              ログイン
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
