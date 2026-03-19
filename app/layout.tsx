import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "App Atelier",
  description: "個人開発者のアプリショーケース",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={geistSans.variable} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 antialiased">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
