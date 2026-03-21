import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { id: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: app } = await supabase
    .from("aa_apps")
    .select("name, tagline, icon_url")
    .eq("id", params.id)
    .single();

  // edge runtimeで外部画像をfetchしてArrayBufferとして渡す（BufferはNG）
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
    ? (() => { const u = new Uint8Array(iconData!); let s = ""; for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return `data:${iconMime};base64,${btoa(s)}`; })()
    : null;

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
          padding: "0",
        }}
      >
        {/* 左: アイコン */}
        <div
          style={{
            width: 630,
            height: 630,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            background: "#18181b",
          }}
        >
          {iconSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={iconSrc}
              width={380}
              height={380}
              style={{ borderRadius: 76 }}
            />
          ) : (
            <div
              style={{
                width: 380,
                height: 380,
                borderRadius: 76,
                background: "#27272a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 140,
                color: "#52525b",
              }}
            >
              {(app?.name ?? "A")[0]}
            </div>
          )}
        </div>

        {/* 右: テキスト */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px 60px 60px 56px",
            gap: 0,
          }}
        >
          <div
            style={{
              fontSize: 22,
              color: "#71717a",
              marginBottom: 20,
              letterSpacing: 2,
            }}
          >
            App Atelier
          </div>
          <div
            style={{
              fontSize: 54,
              fontWeight: 700,
              color: "#fafafa",
              marginBottom: 24,
              lineHeight: 1.15,
            }}
          >
            {app?.name ?? "App Atelier"}
          </div>
          <div
            style={{
              fontSize: 26,
              color: "#a1a1aa",
              lineHeight: 1.5,
            }}
          >
            {app?.tagline ?? "個人開発者のアプリショーケース"}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
