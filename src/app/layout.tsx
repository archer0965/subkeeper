import type { Metadata, Viewport } from "next";
import { Noto_Sans_TC, Sora } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const noto = Noto_Sans_TC({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "訂閱管家｜拓新雲端 NovaOS",
  description:
    "使用拓新雲端 NovaOS 帳號登入，雲端保存個人訂閱開銷與扣款提醒。",
  applicationName: "訂閱管家",
};

export const viewport: Viewport = {
  themeColor: "#070a0f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant" className="dark">
      <body className={`${sora.variable} ${noto.variable} font-sans antialiased`}>
        {children}
        <Toaster theme="dark" richColors position="top-center" />
      </body>
    </html>
  );
}
