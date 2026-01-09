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

export const metadata = {
  title: 'MuscleAtlas - 회원 운동 현황',
  description: '트레이너가 공유한 회원 운동 정보',
  openGraph: {
    title: 'MuscleAtlas',
    description: '회원 운동 현황을 확인하세요',
    images: ['/app_logo_web.png'],  // public 폴더에 이미지 추가
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
