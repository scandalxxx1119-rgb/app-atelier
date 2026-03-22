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

type BugReport = {
  id: string;
  user_id: string | null;
  title: string;
  content: string;
  status: string;
  created_at: string;
  username?: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "resolved">("pending");
  const [tab, setTab] = useState<"reports" | "bugs">("reports");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth"); return; }
      const { data: profile } = await supabase
        .from("aa_profiles").select("badge").eq("id", data.user.id).single();
      if (profile?.badge !== "master") { router.push("/"); return; }
      fetchReports();
      fetchBugReports();
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

  const fetchBugReports = async () => {
    const { data } = await supabase
      .from("aa_bug_reports")
      .select("id, user_id, title, content, status, created_at")
      .order("created_at", { ascending: false });
    if (!data) return;
    const userIds = [...new Set(data.map((r: BugReport) => r.user_id).filter(Boolean))];
    const profileMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from("aa_profiles").select("id, username").in("id", userIds);
      profiles?.forEach((p: { id: string; username: string }) => { profileMap[p.id] = p.username; });
    }
    setBugReports(data.map((r: BugReport) => ({ ...r, username: profileMap[r.user_id ?? ""] ?? "匿名" })));
  };

  const resolveBug = async (id: string) => {
    await supabase.from("aa_bug_reports").update({ status: "resolved" }).eq("id", id);
    setBugReports((prev) => prev.map((r) => r.id === id ? { ...r, status: "resolved" } : r));
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

  const pendingBugs = bugReports.filter((r) => r.status === "pending");
  const resolvedBugs = bugReports.filter((r) => r.status === "resolved");

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-xl font-bold mb-1">管理画面</h1>
      <p className="text-sm text-zinc-400 mb-6">masterのみ閲覧可</p>

      {/* タブ */}
      <div className="flex gap-2 mb-6 border-b border-zinc-200 dark:border-zinc-800">
        <button onClick={() => setTab("reports")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "reports" ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white" : "border-transparent text-zinc-400"}`}>
          通報 ({reports.filter((r) => r.status === "pending").length})
        </button>
        <button onClick={() => setTab("bugs")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "bugs" ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white" : "border-transparent text-zinc-400"}`}>
          不具合報告 {pendingBugs.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-red-500 text-white">{pendingBugs.length}</span>}
        </button>
      </div>

      {tab === "bugs" && (
        <div>
          {bugReports.length === 0 ? (
            <p className="text-zinc-400 text-sm">不具合報告はありません</p>
          ) : (
            <div className="space-y-4">
              {bugReports.map((r) => (
                <div key={r.id} className={`p-5 rounded-xl border bg-white dark:bg-zinc-900 ${r.status === "pending" ? "border-zinc-200 dark:border-zinc-700" : "border-zinc-100 dark:border-zinc-800 opacity-60"}`}>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <p className="font-semibold text-sm">{r.title}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{r.username} · {new Date(r.created_at).toLocaleDateString("ja-JP")}</p>
                    </div>
                    {r.status === "pending" && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex-shrink-0">未対応</span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 mb-4 whitespace-pre-wrap">{r.content}</p>
                  {r.status === "pending" && (
                    <button onClick={() => resolveBug(r.id)}
                      className="px-4 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                      ✓ 対応済みにする
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "reports" && <>
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
                      <div className="flex items-center gap-2">
                    <Link href={`/apps/${report.app_id}`} target="_blank"
                      className="font-semibold text-sm hover:underline">
                      {report.app_name} →
                    </Link>
                    {reports.filter((r) => r.app_id === report.app_id && r.status === "pending").length >= 3 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">⚠ 3件以上</span>
                    )}
                  </div>
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
      </>}
    </div>
  );
}
