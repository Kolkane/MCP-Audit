import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agentable — Audit de visibilité IA gratuit",
  description: "Découvrez si votre site est visible sur ChatGPT, Perplexity et les agents IA. Score Agent-Readiness gratuit en 24h.",
  keywords: "visibilité IA, audit IA, MCP, ChatGPT référencement, agent IA PME",
  openGraph: {
    title: "Agentable — Êtes-vous visible sur les IA ?",
    description: "67% des sites sont invisibles sur ChatGPT. Découvrez votre score gratuit en 24h.",
    url: "https://agentable.fr",
    siteName: "Agentable",
    locale: "fr_FR",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Agentable — Audit visibilité IA gratuit",
    description: "Votre score Agent-Readiness en 24h."
  },
  robots: {
    index: true,
    follow: true
  },
  alternates: {
    canonical: "https://agentable.fr"
  },
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-background text-white antialiased">{children}</body>
    </html>
  );
}
