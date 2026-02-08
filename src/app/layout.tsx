import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";
import type { Viewport } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NEGA - Your Native English Grammar Assistant | 西海岸纯正口语教练",
  description: "NEGA是您的AI英文语法助手和口语教练。提供实时语法纠正、发音指导和口语提升。英文版: Your Native English Grammar Assistant. 中文版: 你的西海岸纯正口语教练。",
  keywords: ["English Grammar", "Grammar Assistant", "English Coach", "口语教练", "英文语法", "English Learning", "英语学习"],
  authors: [{ name: "NEGA Team" }],
  creator: "NEGA",
  publisher: "NEGA",
  metadataBase: new URL("https://negaapp.com"),
  alternates: {
    canonical: "https://negaapp.com",
    languages: {
      "en-US": "https://negaapp.com/en",
      "zh-CN": "https://negaapp.com/zh",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["zh_CN"],
    url: "https://negaapp.com",
    siteName: "NEGA",
    title: "NEGA - Your Native English Grammar Assistant",
    description: "AI-powered English grammar checker and native speaker oral coach. Learn English naturally.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NEGA - English Grammar Assistant",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NEGA - English Grammar Assistant",
    description: "Your Native English Grammar Assistant & Oral Coach",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0066FF" },
    { media: "(prefers-color-scheme: dark)", color: "#00D4FF" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
