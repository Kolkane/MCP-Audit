"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { MAINTENANCE_PRICE } from "@/lib/pricing";
import { useHeroAnalyzer } from "@/components/hero-analyzer-context";

const tiers = [
  {
    label: "Site simple (score >60) — quelques optimisations",
    price: "249€ HT",
    color: "text-[#15803D]"
  },
  {
    label: "Site moyen (score 40-60) — refonte partielle",
    price: "390€ HT",
    color: "text-[#F97316]"
  },
  {
    label: "Site complexe (score <40) — restructuration complète",
    price: "590€ HT",
    color: "text-[#EF4444]"
  }
];

const maintenanceFeatures = [
  "Monitoring score mensuel automatisé",
  "Mises à jour dès qu'un critère baisse",
  "Rapport mensuel + alertes en temps réel"
];

export function PricingPlans({ calendlyUrl }: { calendlyUrl: string }) {
  const [pricingUrl, setPricingUrl] = useState("");
  const { setUrl, analyze } = useHeroAnalyzer();

  const handlePricingAnalyze = () => {
    if (!pricingUrl.trim()) return;
    const target = pricingUrl.trim();
    setUrl(target);
    document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => {
      analyze(target);
    }, 800);
  };

  return (
    <div className="mx-auto mt-10 max-w-3xl space-y-6">
      <div id="pricing-form" className="rounded-3xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate">Mise en conformité</p>
            <h3 className="mt-3 text-4xl font-black text-night">À partir de 249€ HT</h3>
            <p className="mt-2 text-sm text-[#64748B]">Le prix exact dépend de votre site — analysez gratuitement pour le connaître.</p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-accent">Score garanti &gt;80/100</span>
        </div>
        <div className="my-6 h-px w-full bg-[#F1F5F9]" />
        <p className="text-sm text-[#64748B]">Notre agent évalue 8 critères techniques. Le prix varie selon :</p>
        <div className="mt-4 space-y-2 text-sm text-night">
          {tiers.map((tier) => (
            <div key={tier.label} className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
              <span>{tier.label}</span>
              <span className={`text-sm font-semibold ${tier.color}`}>{tier.price}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs italic text-[#94A3B8]">Le volume de données et la taille de votre site peuvent également influencer le prix final.</p>
        <div className="my-6 h-px w-full bg-[#F1F5F9]" />
        <ul className="space-y-3 text-sm text-night">
          {["Analyse complète de votre site", "Conformité livrée en 48h", "Endpoint MCP + schema.org optimisé", "Score garanti >80/100"].map(
            (feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                {feature}
              </li>
            )
          )}
        </ul>
        <div className="mt-6 rounded-2xl bg-[#F8F9FF] p-6">
          <p className="text-base font-semibold text-night">Connaître mon prix exact</p>
          <p className="text-sm text-[#64748B]">Entrez votre URL — résultat en 60 secondes.</p>
          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <input
              type="url"
              value={pricingUrl}
              onChange={(event) => setPricingUrl(event.target.value)}
              placeholder="https://votre-site.fr"
              className="flex-1 rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm focus:border-accent focus:outline-none"
            />
            <button
              type="button"
              onClick={handlePricingAnalyze}
              disabled={!pricingUrl.trim()}
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              Analyser →
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-[#0F172A] p-8 text-white shadow-lg">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="md:w-2/3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">Maintenance mensuelle</p>
            <h3 className="mt-2 text-xl font-bold text-white">Pourquoi la maintenance est essentielle</h3>
            <p className="mt-3 text-sm text-white/60 leading-relaxed">
              Les algorithmes des IA évoluent chaque mois. Un site optimisé aujourd'hui peut perdre 30 points de score en 3 mois sans suivi.
            </p>
            <p className="mt-2 text-sm text-white/60 leading-relaxed">
              Sans maintenance, votre score baisse. Avec elle, il reste au-dessus de 80/100 toute l'année — automatiquement.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              {maintenanceFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-300" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div className="md:w-1/3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white">
              <p className="text-5xl font-black">79€</p>
              <p className="text-lg text-white/70">/mois</p>
              <p className="mt-1 text-xs text-white/60">Sans engagement · résiliable en 1 clic</p>
              <button
                type="button"
                onClick={() => {
                  document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" });
                  setTimeout(() => {
                    const heroInput = document.querySelector<HTMLInputElement>("#hero input[type='url']");
                    heroInput?.focus();
                  }, 400);
                }}
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
