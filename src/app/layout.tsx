import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReMarket - AI-Powered Flea Marketplace",
  description:
    "Buy and sell pre-owned clothing, jewelry, watches, purses, and more with AI-powered features",
  keywords: [
    "marketplace",
    "secondhand",
    "resale",
    "clothing",
    "jewelry",
    "watches",
    "AI",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
