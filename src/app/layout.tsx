import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "2n5a - تطبيق VPN عربي احترافي",
  description: "تطبيق VPN عربي احترافي مبني على V2Ray وXray مع دعم Shizuku وHotspot",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0D0E12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0D0E12] text-white antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
