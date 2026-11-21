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

const siteTitle = "訂閱管家｜智慧訂閱管理 × 雲端助手";
const siteDescription =
  "集中管理所有訂閱項目，提供續訂提醒與該月訂閱費用彙整，讓財務狀況一目了然。永久免費，使用拓新雲端 NovaOS 帳號登入即可雲端保存。";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      "https://temporary-speedy-reef-cy4xhhu.vercel.app",
  ),
  title: {
    default: siteTitle,
    template: "%s｜訂閱管家",
  },
  description: siteDescription,
  applicationName: "訂閱管家",
  openGraph: {
    type: "website",
    locale: "zh_TW",
    siteName: "訂閱管家",
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "訂閱管家｜智慧訂閱管理 × 雲端助手",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/opengraph-image"],
  },
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
