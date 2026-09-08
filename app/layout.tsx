import type { Metadata } from "next";
import "./globals.css";
import SiteGate from "./components/SiteGate";

export const metadata: Metadata = {
  title: "Yoru Translation Group",
  description: "Manga · Manhwa · Manhua",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <SiteGate>
          {children}
        </SiteGate>
      </body>
    </html>
  );
}