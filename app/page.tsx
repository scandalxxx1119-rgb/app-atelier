import { createClient } from "@supabase/supabase-js";
import HomeClient from "@/components/HomeClient";
import { PLATINUM_LIMIT } from "@/lib/types";
import type { App } from "@/lib/types";

export const dynamic = "force-dynamic";

type RpcRow = Omit<App, "aa_profiles"> & { username?: string; badge?: string | null };

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));
  return Promise.race([promise, timeout]);
}

export default async function HomePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [appsResult, countResult] = await Promise.all([
    withTimeout(
      supabase.rpc("get_home_apps", {
        p_sort: "created_at",
        p_tab: "all",
        p_user_id: null,
        p_search: "",
      }),
      5000
    ),
    withTimeout(
      supabase.from("aa_profiles").select("id", { count: "exact" }).eq("badge", "platinum"),
      5000
    ),
  ]);

  let initialApps: App[] = [];

  if (appsResult && !appsResult.error && appsResult.data) {
    initialApps = (appsResult.data as RpcRow[]).map((a) => ({
      ...a,
      aa_profiles: a.username ? { username: a.username, badge: a.badge ?? null } : null,
    }));
  }

  const platinumCount = countResult?.count ?? 0;

  return (
    <HomeClient
      initialApps={initialApps}
      platinumCount={platinumCount}
      platinumLimit={PLATINUM_LIMIT}
    />
  );
}
