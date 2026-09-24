import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { getLang } from "@/lib/i18n";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: { default: "TeridoxTour", template: "%s | TeridoxTour" },
  description: "Sewa mobil dan tour Bali dengan sopir. Car rental and driver-guided tours in Bali.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={await getLang()} className={outfit.variable}>
      <body className="min-h-[100dvh] font-sans">{children}</body>
    </html>
  );
}
