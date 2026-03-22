"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        supabase.from("aa_profiles").select("avatar_url").eq("id", data.user.id).single()
          .then(({ data: profile }) => setAvatarUrl(profile?.avatar_url ?? null));
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          supabase.from("aa_profiles").select("avatar_url").eq("id", session.user.id).single()
            .then(({ data: profile }) => setAvatarUrl(profile?.avatar_url ?? null));
        } else {
          setAvatarUrl(null);
        }
      }
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
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 w-full overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
        <nav className="flex items-center gap-1 text-xs shrink-0">
          {navLink("/", "ホーム")}
          {navLink("/board", "掲示板")}
          {navLink("/resources", "About")}
        </nav>
        <nav className="flex items-center gap-1 text-xs shrink-0">
          {user ? (
            <>
              <Link
                href="/submit"
                className={`px-3 py-1.5 rounded-full font-medium text-xs whitespace-nowrap transition-all ${
                  pathname === "/submit"
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                    : "border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <span className="hidden sm:inline">アプリを投稿</span>
                <span className="sm:hidden">投稿</span>
              </Link>
              <Link
                href="/profile"
                className={`flex items-center transition-colors rounded-full ${
                  pathname === "/profile" ? "ring-2 ring-zinc-900 dark:ring-white" : ""
                }`}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <span className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    👤
                  </span>
                )}
              </Link>
              <button
                onClick={() => supabase.auth.signOut()}
                className="hidden sm:block px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap"
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
