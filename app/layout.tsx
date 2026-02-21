import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agentable — Audit visibilité IA",
  description: "Obtenez votre score de visibilité IA et rendez votre site lisible par les agents IA en 48h."
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
