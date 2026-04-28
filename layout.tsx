import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "极境智牧-智慧养殖管理平台",
  description: "极境智牧-智慧养殖管理平台，专为寒区肉鸡场打造的全方位数字化养殖管理系统，涵盖环境监控、批次管理、健康预警、用药管理、成本分析等功能。",
  keywords: ["极境智牧", "智慧养殖管理平台", "智慧养殖", "鸡场管理", "寒区养殖", "数字化养殖", "肉鸡"],
  authors: [{ name: "极境智牧团队" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Toaster richColors position="top-right" closeButton theme="light" />
      </body>
    </html>
  );
}
