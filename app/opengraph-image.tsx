import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
          fontFamily: "sans-serif",
        }}
      >
        {/* ロゴ */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 24,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 52,
            marginBottom: 32,
          }}
        >
          🎨
        </div>

        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#fafafa",
            marginBottom: 16,
            letterSpacing: "-2px",
          }}
        >
          App Atelier
        </div>

        <div
          style={{
            fontSize: 30,
            color: "#a1a1aa",
          }}
        >
          個人開発者のアプリショーケース
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
