import type { Metadata } from "next";
import { Hanken_Grotesk, Newsreader } from "next/font/google";
import "./globals.css";
import { getLang } from "@/lib/i18n";

const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: { default: "TeridoxTour", template: "%s | TeridoxTour" },
  description: "Private tours across Bali and Labuan Bajo. Tour privat di Bali dan Labuan Bajo.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={await getLang()} className={`${hanken.variable} ${newsreader.variable}`}>
      <body className="min-h-[100dvh] font-sans">{children}</body>
    </html>
  );
}
