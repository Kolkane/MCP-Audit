"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { MAINTENANCE_PRICE } from "@/lib/pricing";

const complianceFeatures = [
  "Audit GEO technique complet",
  "Optimisation livrée sous 48h",
  "Schema.org + llms.txt générés",
  "Score de conformité IA amélioré"
];

const maintenanceFeatures = [
  "Suivi mensuel de votre score GEO",
  "Mises à jour techniques automatiques si score en baisse",
  "Rapport mensuel avec KPIs réels",
  "Veille algorithmes IA"
];

export function PricingPlans({ calendlyUrl }: { calendlyUrl: string }) {
  const focusHeroInput = () => {
    document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => {
      const heroInput = document.querySelector<HTMLInputElement>("#hero input[type='url']");
      heroInput?.focus();
    }, 400);
  };

  return (
    <div className="mx-auto mt-10 max-w-3xl space-y-6">
      <div className="rounded-3xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate">Mise en conformité</p>
        <h3 className="mt-3 text-4xl font-black text-night">À partir de 349€ HT</h3>
        <p className="mt-2 text-sm text-[#64748B]">
          Votre prix exact est calculé automatiquement selon votre score. Entrez votre URL pour le connaître.
        </p>
        <div className="mt-4 space-y-1 text-sm font-semibold text-[#94A3B8]">
          <p>● Site simple (score &gt;60) → 349€ HT</p>
          <p>● Site moyen (score 40-60) → 490€ HT</p>
          <p>● Site complexe (score &lt;40) → 690€ HT</p>
        </div>
        <p className="mt-3 text-xs italic text-[#94A3B8]">
          Les agences GEO facturent ce service entre 1 500€ et 3 000€ HT. Agentable le fait en automatique, livré sous 48h.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-night">
          {complianceFeatures.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-indigo-500" />
              {feature}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={focusHeroInput}
          className="mt-6 w-full rounded-xl bg-indigo-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Analyser mon site pour voir mon prix →
        </button>
      </div>

      <div className="rounded-3xl bg-[#0F172A] p-8 text-white shadow-lg">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="md:w-2/3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">Maintenance mensuelle</p>
            <h3 className="mt-2 text-xl font-bold text-white">Pourquoi la maintenance est essentielle</h3>
            <p className="mt-3 text-sm text-white/60 leading-relaxed">
              Les algorithmes des IA évoluent chaque mois. Un site optimisé aujourd'hui peut perdre en lisibilité en 3 mois sans suivi. Notre agent repasse sur votre site chaque mois, mesure l'évolution de votre score GEO et applique les mises à jour nécessaires.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              {maintenanceFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-300" />
                  {feature}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-white/70">Score GEO suivi et optimisé en continu.</p>
          </div>
          <div className="md:w-1/3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white">
              <p className="text-5xl font-black">{MAINTENANCE_PRICE}€</p>
              <p className="text-lg text-white/70">/mois</p>
              <p className="mt-1 text-xs text-white/60">Sans engagement · résiliable en 1 clic</p>
              <button
                type="button"
                onClick={focusHeroInput}
                className="mt-6 w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white"
              >
                Ajouter après mon audit →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-dashed border-[#C7D2FE] bg-[#F8F9FF] p-6 text-night">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-base font-bold text-night">Une question avant de vous lancer ?</p>
            <p className="text-sm text-slate">Appel gratuit · 20 min · sans engagement</p>
            <p className="text-xs text-[#94A3B8]">⏱ Disponible sous 24h</p>
          </div>
          <Link
            href={calendlyUrl}
            target="_blank"
            className="w-full rounded-xl border border-accent px-6 py-3 text-center text-sm font-semibold text-accent md:w-auto"
          >
            Réserver →
          </Link>
        </div>
      </div>
    </div>
  );
}
