import { createClient } from "@supabase/supabase-js";
import HomeClient from "@/components/HomeClient";
import { PLATINUM_LIMIT } from "@/lib/types";
import type { App } from "@/lib/types";

export const revalidate = 60;

type RpcRow = Omit<App, "aa_profiles"> & { username?: string; badge?: string | null };

export default async function HomePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [appsResult, countResult] = await Promise.all([
    supabase.rpc("get_home_apps", {
      p_sort: "created_at",
      p_tab: "all",
      p_user_id: null,
      p_search: "",
    }),
    supabase
      .from("aa_profiles")
      .select("id", { count: "exact" })
      .eq("badge", "platinum"),
  ]);

  let initialApps: App[] = [];

  if (!appsResult.error && appsResult.data) {
    initialApps = (appsResult.data as RpcRow[]).map((a) => ({
      ...a,
      aa_profiles: a.username ? { username: a.username, badge: a.badge ?? null } : null,
    }));
  } else {
    const { data: fallback } = await supabase
      .from("aa_apps")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (fallback && fallback.length > 0) {
      const userIds = [...new Set((fallback as App[]).map((a) => a.user_id))];
      const { data: profiles } = await supabase
        .from("aa_profiles")
        .select("id, username, badge")
        .in("id", userIds);
      const profileMap: Record<string, { username: string; badge: string | null }> = {};
      profiles?.forEach((p: { id: string; username: string; badge: string | null }) => {
        profileMap[p.id] = p;
      });
      initialApps = (fallback as App[]).map((a) => ({
        ...a,
        aa_profiles: profileMap[a.user_id] ?? null,
      }));
    }
  }

  return (
    <HomeClient
      initialApps={initialApps}
      platinumCount={countResult.count ?? 0}
      platinumLimit={PLATINUM_LIMIT}
    />
  );
}
