import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agentable — Audit de visibilité IA gratuit",
  description: "Obtenez votre score de visibilité IA et rendez votre site lisible par les agents IA en 48h.",
  openGraph: {
    title: "Agentable — Audit visibilité IA gratuit",
    description: "Découvrez si votre site est lisible par ChatGPT et les agents IA. Score gratuit en 24h.",
    url: "https://agentable.fr",
    type: "website"
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
