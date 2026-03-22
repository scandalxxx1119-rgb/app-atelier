import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";

const getApp = cache(async (id: string) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: app } = await supabase
    .from("aa_apps")
    .select("name, tagline, description, icon_url, tags, status, url, app_store_url, play_store_url, user_id")
    .eq("id", id)
    .single();
  if (!app) return null;
  const { data: profile } = await supabase
    .from("aa_profiles")
    .select("username")
    .eq("id", app.user_id)
    .single();
  return { ...app, username: profile?.username ?? null };
});

const BASE_URL = "https://app-atelier.vercel.app";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const app = await getApp(id);
  if (!app) return { title: "App Atelier" };

  const description = [app.tagline, app.description?.slice(0, 100)]
    .filter(Boolean)
    .join(" — ");

  return {
    title: `${app.name} | App Atelier`,
    description,
    keywords: app.tags ?? [],
    openGraph: {
      title: `${app.name} | App Atelier`,
      description: app.tagline ?? "",
      type: "website",
      url: `${BASE_URL}/apps/${id}`,
      siteName: "App Atelier",
    },
    twitter: {
      card: "summary_large_image",
      title: `${app.name} | App Atelier`,
      description: app.tagline ?? "",
    },
  };
}

function getOS(tags: string[] | null): string {
  if (!tags) return "Web";
  const osMap: Record<string, string> = {
    iOS: "iOS", Android: "Android", Web: "Web", Mac: "macOS", Windows: "Windows",
  };
  const detected = tags.filter((t) => osMap[t]).map((t) => osMap[t]);
  return detected.length > 0 ? detected.join(", ") : "Web";
}

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const app = await getApp(id);

  const jsonLd = app
    ? {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: app.name,
        description: app.tagline || app.description || "",
        applicationCategory: "Application",
        operatingSystem: getOS(app.tags),
        url: `${BASE_URL}/apps/${id}`,
        ...(app.app_store_url ? { downloadUrl: app.app_store_url } : {}),
        ...(app.url ? { sameAs: app.url } : {}),
        ...(app.username
          ? { author: { "@type": "Person", name: app.username } }
          : {}),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd)
              .replace(/</g, "\\u003c")
              .replace(/>/g, "\\u003e")
              .replace(/&/g, "\\u0026"),
          }}
        />
      )}
      {children}
    </>
  );
}
