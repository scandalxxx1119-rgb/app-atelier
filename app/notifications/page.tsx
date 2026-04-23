"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Notification = {
  id: string;
  type: string;
  message: string;
  url: string | null;
  is_read: boolean;
  created_at: string;
};

const typeIcon: Record<string, string> = {
  like: "♥",
  comment: "💬",
  follow: "👤",
  tester_applied: "🧪",
  tester_approved: "✅",
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth"); return; }

      const { data: notifs } = await supabase
        .from("aa_web_notifications")
        .select("id, type, message, url, is_read, created_at")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setNotifications((notifs ?? []) as Notification[]);

      // 未読を一括既読
      const unreadIds = (notifs ?? []).filter((n: Notification) => !n.is_read).map((n: Notification) => n.id);
      if (unreadIds.length > 0) {
        await supabase.from("aa_web_notifications").update({ is_read: true }).in("id", unreadIds);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      }

      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-3">
      {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-xl font-bold mb-6">通知</h1>
      {notifications.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          <p>通知はまだありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                n.is_read
                  ? "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                  : "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950"
              }`}
            >
              <span className="text-lg flex-shrink-0">{typeIcon[n.type] ?? "🔔"}</span>
              <div className="flex-1 min-w-0">
                {n.url ? (
                  <Link href={n.url} className="text-sm hover:underline">{n.message}</Link>
                ) : (
                  <p className="text-sm">{n.message}</p>
                )}
                <p className="text-xs text-zinc-400 mt-0.5">
                  {new Date(n.created_at).toLocaleDateString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {!n.is_read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
