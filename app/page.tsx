import { createClient } from "@supabase/supabase-js";
import HomeClient from "@/components/HomeClient";
import type { App } from "@/components/HomeClient";

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

  const initialApps: App[] = ((appsResult.data ?? []) as RpcRow[]).map((a) => ({
    ...a,
    aa_profiles: a.username ? { username: a.username, badge: a.badge ?? null } : null,
  }));

  return (
    <HomeClient
      initialApps={initialApps}
      platinumCount={countResult.count ?? 0}
    />
  );
}
