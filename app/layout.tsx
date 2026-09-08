import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import SiteGate from "./components/SiteGate";

export const metadata: Metadata = {
  title: "Yoru Translation Group",
  description: "Manga · Manhwa · Manhua",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
      <Script
  id="monetag-popunder"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `(function(s){s.dataset.zone='11752123',s.src='https://al5sm.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`,
  }}
/>
        <SiteGate>
          {children}
        </SiteGate>
      </body>
    </html>
  );
}