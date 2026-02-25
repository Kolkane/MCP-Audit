import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agentable — Audit visibilité IA gratuit",
  description: "Découvrez si votre site est visible sur ChatGPT, Perplexity et les agents IA. Score Agent-Readiness gratuit en 24h."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
