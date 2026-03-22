"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Application = {
  id: string;
  user_id: string;
  status: string;
  message: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
};

type AppInfo = {
  id: string;
  name: string;
  user_id: string;
  tester_slots: number;
  tester_reward_points: number;
};

export default function TestersPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [app, setApp] = useState<AppInfo | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth"); return; }
      setUser(data.user);

      const { data: appData } = await supabase
        .from("aa_apps")
        .select("id, name, user_id, tester_slots, tester_reward_points")
        .eq("id", id)
        .single();

      if (!appData || appData.user_id !== data.user.id) {
        router.push("/profile");
        return;
      }
      setApp(appData as AppInfo);

      const { data: apps } = await supabase
        .from("aa_tester_applications")
        .select("*")
        .eq("app_id", id)
        .order("created_at", { ascending: false });

      if (apps) {
        setApplications(apps as Application[]);
        const userIds = apps.map((a: Application) => a.user_id);
        if (userIds.length > 0) {
          const { data: profileData } = await supabase
            .from("aa_profiles")
            .select("id, username, avatar_url")
            .in("id", userIds);
          if (profileData) {
            const map: Record<string, Profile> = {};
            profileData.forEach((p: Profile) => { map[p.id] = p; });
            setProfiles(map);
          }
        }
      }
      setLoading(false);
    });
  }, [id, router]);

  const updateStatus = async (applicationId: string, status: "approved" | "rejected") => {
    setUpdating(applicationId);
    const { error } = await supabase.from("aa_tester_applications").update({ status }).eq("id", applicationId);

    if (error) {
      alert("ステータスの更新に失敗しました。時間をおいて再試行してください。");
      setUpdating(null);
      return;
    }

    // 承認時のみポイント付与（DB確認で2重付与を防止）
    if (status === "approved" && app && app.tester_reward_points > 0) {
      const target = applications.find((a) => a.id === applicationId);
      if (target && target.status !== "approved") {
        const { count } = await supabase.from("aa_points")
          .select("*", { count: "exact", head: true })
          .eq("user_id", target.user_id)
          .eq("app_id", app.id)
          .eq("reason", `「${app.name}」のテスターに承認`);
        if ((count ?? 0) === 0) {
          await supabase.from("aa_points").insert({
            user_id: target.user_id,
            amount: app.tester_reward_points,
            reason: `「${app.name}」のテスターに承認`,
            app_id: app.id,
          });
        }
      }
    }

    setApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, status } : a))
    );
    setUpdating(null);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const pending = applications.filter((a) => a.status === "pending");
  const approved = applications.filter((a) => a.status === "approved");
  const rejected = applications.filter((a) => a.status === "rejected");

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/apps/${id}`} className="text-sm text-zinc-400 hover:underline">
          ← {app?.name}
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-2">テスター管理</h1>
      <p className="text-sm text-zinc-400 mb-8">
        申請 {applications.length}件 / 枠 {app?.tester_slots}人 / 報酬 {app?.tester_reward_points}pt
      </p>

      {applications.length === 0 && (
        <p className="text-zinc-400 text-sm">まだ申請がありません</p>
      )}

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">
            未対応（{pending.length}）
          </h2>
          <div className="space-y-3">
            {pending.map((a) => (
              <ApplicationCard
                key={a.id}
                application={a}
                profile={profiles[a.user_id]}
                updating={updating === a.id}
                onApprove={() => updateStatus(a.id, "approved")}
                onReject={() => updateStatus(a.id, "rejected")}
              />
            ))}
          </div>
        </section>
      )}

      {approved.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">
            承認済み（{approved.length}）
          </h2>
          <div className="space-y-3">
            {approved.map((a) => (
              <ApplicationCard
                key={a.id}
                application={a}
                profile={profiles[a.user_id]}
                updating={updating === a.id}
                onApprove={() => updateStatus(a.id, "approved")}
                onReject={() => updateStatus(a.id, "rejected")}
              />
            ))}
          </div>
        </section>
      )}

      {rejected.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">
            見送り（{rejected.length}）
          </h2>
          <div className="space-y-3">
            {rejected.map((a) => (
              <ApplicationCard
                key={a.id}
                application={a}
                profile={profiles[a.user_id]}
                updating={updating === a.id}
                onApprove={() => updateStatus(a.id, "approved")}
                onReject={() => updateStatus(a.id, "rejected")}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ApplicationCard({
  application,
  profile,
  updating,
  onApprove,
  onReject,
}: {
  application: Application;
  profile: Profile | undefined;
  updating: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const statusLabel = {
    pending: { text: "未対応", cls: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500" },
    approved: { text: "承認済み", cls: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300" },
    rejected: { text: "見送り", cls: "bg-red-100 dark:bg-red-900 text-red-500 dark:text-red-400" },
  }[application.status] ?? { text: application.status, cls: "bg-zinc-100 text-zinc-500" };

  return (
    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.username} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400 flex-shrink-0">
            {(profile?.username ?? "?")[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {profile ? (
              <Link href={`/users/${profile.username}`} className="text-sm font-medium hover:underline">
                {profile.username}
              </Link>
            ) : (
              <span className="text-sm font-medium text-zinc-400">anonymous</span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusLabel.cls}`}>
              {statusLabel.text}
            </span>
          </div>
          {application.message && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap">{application.message}</p>
          )}
          <p className="text-xs text-zinc-400 mt-1">
            {new Date(application.created_at).toLocaleDateString("ja-JP")}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {application.status !== "approved" && (
            <button
              onClick={onApprove}
              disabled={updating}
              className="px-3 py-1.5 text-xs rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              承認
            </button>
          )}
          {application.status !== "rejected" && (
            <button
              onClick={onReject}
              disabled={updating}
              className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              見送り
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
