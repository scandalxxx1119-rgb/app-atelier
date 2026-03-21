"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Report = {
  id: string;
  app_id: string;
  reason: string;
  status: string;
  created_at: string;
  app_name?: string;
  reporter_username?: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "resolved">("pending");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth"); return; }
      const { data: profile } = await supabase
        .from("aa_profiles").select("badge").eq("id", data.user.id).single();
      if (profile?.badge !== "master") { router.push("/"); return; }
      fetchReports();
    });
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("aa_reports")
      .select("id, app_id, reason, status, created_at, reporter_id")
      .order("created_at", { ascending: false });

    if (!data) { setLoading(false); return; }

    const appIds = [...new Set(data.map((r: Report) => r.app_id))];
    const reporterIds = [...new Set(data.map((r: Report & { reporter_id: string }) => r.reporter_id).filter(Boolean))];

    const [appsRes, profilesRes] = await Promise.all([
      supabase.from("aa_apps").select("id, name").in("id", appIds),
      reporterIds.length > 0
        ? supabase.from("aa_profiles").select("id, username").in("id", reporterIds)
        : Promise.resolve({ data: [] }),
    ]);

    const appMap: Record<string, string> = {};
    appsRes.data?.forEach((a: { id: string; name: string }) => { appMap[a.id] = a.name; });
    const profileMap: Record<string, string> = {};
    (profilesRes.data ?? []).forEach((p: { id: string; username: string }) => { profileMap[p.id] = p.username; });

    setReports(data.map((r: Report & { reporter_id: string }) => ({
      ...r,
      app_name: appMap[r.app_id] ?? "不明",
      reporter_username: profileMap[r.reporter_id] ?? "匿名",
    })));
    setLoading(false);
  };

  const resolve = async (id: string) => {
    await supabase.from("aa_reports").update({ status: "resolved" }).eq("id", id);
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: "resolved" } : r));
  };

  const deleteApp = async (appId: string, reportId: string) => {
    if (!confirm("このアプリを削除しますか？")) return;
    await supabase.from("aa_apps").delete().eq("id", appId);
    await supabase.from("aa_reports").update({ status: "resolved" }).eq("id", reportId);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  };

  const filtered = reports.filter((r) => r.status === filter);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-xl font-bold mb-1">通報管理</h1>
      <p className="text-sm text-zinc-400 mb-6">masterのみ閲覧可</p>

      {/* フィルター */}
      <div className="flex gap-2 mb-6">
        {(["pending", "resolved"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${filter === s ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent" : "border-zinc-200 dark:border-zinc-700 text-zinc-500"}`}>
            {s === "pending" ? `未対応 (${reports.filter((r) => r.status === "pending").length})` : `対応済み (${reports.filter((r) => r.status === "resolved").length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-zinc-400 text-sm">読み込み中...</p>
      ) : filtered.length === 0 ? (
        <p className="text-zinc-400 text-sm">{filter === "pending" ? "未対応の通報はありません" : "対応済みの通報はありません"}</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((report) => (
            <div key={report.id} className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <Link href={`/apps/${report.app_id}`} target="_blank"
                    className="font-semibold text-sm hover:underline">
                    {report.app_name} →
                  </Link>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    通報者: {report.reporter_username} · {new Date(report.created_at).toLocaleDateString("ja-JP")}
                  </p>
                </div>
                {report.status === "pending" && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex-shrink-0">
                    未対応
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 mb-4">
                {report.reason}
              </p>
              {report.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => resolve(report.id)}
                    className="px-4 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    ✓ 対応済みにする
                  </button>
                  <button onClick={() => deleteApp(report.app_id, report.id)}
                    className="px-4 py-1.5 rounded-lg border border-red-200 dark:border-red-900 text-red-500 text-sm hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                    🗑 アプリを削除
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
