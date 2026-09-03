import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}