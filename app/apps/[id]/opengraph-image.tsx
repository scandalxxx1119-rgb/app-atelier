import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: app } = await supabase
    .from("aa_apps")
    .select("name, tagline, icon_url")
    .eq("id", id)
    .single();

  let iconData: ArrayBuffer | null = null;
  let iconMime = "image/png";
  if (app?.icon_url) {
    try {
      const res = await fetch(app.icon_url);
      iconData = await res.arrayBuffer();
      iconMime = res.headers.get("content-type") ?? "image/png";
    } catch {
      iconData = null;
    }
  }

  const iconSrc = iconData
    ? (() => {
        const u = new Uint8Array(iconData!);
        let s = "";
        for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
        return `data:${iconMime};base64,${btoa(s)}`;
      })()
    : null;

  const name = app?.name ?? "App Atelier";
  const tagline = app?.tagline ?? "個人開発者のアプリショーケース";

  return new ImageResponse(
    (
      <div
        style={{
          background: "#09090b",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: "630px",
            height: "630px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            background: "#18181b",
          }}
        >
          {iconSrc ? (
            <img
              src={iconSrc}
              width={380}
              height={380}
              style={{ borderRadius: "76px" }}
            />
          ) : (
            <div
              style={{
                width: "380px",
                height: "380px",
                borderRadius: "76px",
                background: "#27272a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "140px",
                color: "#52525b",
              }}
            >
              {name[0]}
            </div>
          )}
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px 60px 60px 56px",
          }}
        >
          <div
            style={{
              fontSize: "22px",
              color: "#71717a",
              marginBottom: "20px",
              letterSpacing: "2px",
            }}
          >
            App Atelier
          </div>
          <div
            style={{
              fontSize: "54px",
              fontWeight: 700,
              color: "#fafafa",
              marginBottom: "24px",
              lineHeight: 1.15,
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: "26px",
              color: "#a1a1aa",
              lineHeight: 1.5,
            }}
          >
            {tagline}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
