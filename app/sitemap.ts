import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";

const BASE_URL = "https://appatelier.dev";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [appsRes, usersRes] = await Promise.all([
    supabase
      .from("aa_apps")
      .select("id, created_at")
      .eq("is_hidden", false)
      .order("created_at", { ascending: false }),
    supabase.from("aa_profiles").select("username, created_at"),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/testers`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/points`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/badges`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/resources`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/platinum`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  const appPages: MetadataRoute.Sitemap = (appsRes.data ?? []).map((app) => ({
    url: `${BASE_URL}/apps/${app.id}`,
    lastModified: new Date(app.created_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const userPages: MetadataRoute.Sitemap = (usersRes.data ?? []).map((u) => ({
    url: `${BASE_URL}/users/${u.username}`,
    lastModified: new Date(u.created_at),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticPages, ...appPages, ...userPages];
}
