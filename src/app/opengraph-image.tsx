import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "訂閱管家｜智慧訂閱管理 × 雲端助手";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background:
            "linear-gradient(145deg, #070a0f 0%, #0f1a22 50%, #06251f 100%)",
          color: "#e2e8f0",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 24,
            letterSpacing: "0.18em",
            color: "#5eead4",
            fontWeight: 600,
          }}
        >
          拓新雲端 NovaOS · 永久免費
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-0.03em" }}
          >
            訂閱管家｜智慧訂閱管理 × 雲端助手
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.45, maxWidth: 900, color: "#94a3b8" }}>
            集中管理所有訂閱項目，提供續訂提醒與該月訂閱費用彙整，讓財務狀況一目了然。
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#2dd4bf" }}>
          續訂提醒 · 月費彙整 · 雲端同步
        </div>
      </div>
    ),
    size,
  );
}
