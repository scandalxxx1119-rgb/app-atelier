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

  // edge runtimeで外部画像を読み込むためにfetchしてbase64に変換
  let iconSrc: string | null = null;
  if (app?.icon_url) {
    try {
      const res = await fetch(app.icon_url);
      const buf = await res.arrayBuffer();
      const base64 = Buffer.from(buf).toString("base64");
      const mime = res.headers.get("content-type") ?? "image/png";
      iconSrc = `data:${mime};base64,${base64}`;
    } catch {
      iconSrc = null;
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: "#09090b",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        {iconSrc && (
          <img
            src={iconSrc}
            width={120}
            height={120}
            style={{ borderRadius: 24, marginBottom: 32 }}
          />
        )}
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "#fafafa",
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          {app?.name ?? "App Atelier"}
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#a1a1aa",
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          {app?.tagline ?? "個人開発者のアプリショーケース"}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 20,
            color: "#52525b",
          }}
        >
          app-atelier.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
