import type { Metadata } from "next";
import "./globals.css";
import { NotificationCenter } from "@/components/shared/NotificationCenter";

export const metadata: Metadata = {
  title: "JoinPic · 图片拼接工作台",
  description:
    "JoinPic 是一款便捷的图片拼接工具，支持多种模版与灵活布局。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;  
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        <NotificationCenter />
        {children}
      </body>
    </html>
  );
}
