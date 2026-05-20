import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Inyo — Family Office OS",
  description: "Private AI operating system for modern family offices.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full flex overflow-hidden" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
        {children}
      </body>
    </html>
  );
}
