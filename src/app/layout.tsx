import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Đoàn kết Hai Bà Trưng",
  description: "App quản lý thành viên, sinh nhật và tiền đội bóng.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hai Bà Trưng",
  },
  icons: {
    icon: [
      { url: "/icon-512.jpg", sizes: "512x512", type: "image/jpeg" },
      { url: "/7810e745-f1a8-4740-98a9-e17d21f50633.jpeg", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.jpg", sizes: "180x180", type: "image/jpeg" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
