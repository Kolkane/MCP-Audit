"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import { PRICE_LEVELS } from "@/lib/pricing";

const maintenanceFeatures = [
  "Monitoring visibilité IA mensuel",
  "Mises à jour automatiques",
  "Alertes + rapport mensuel détaillé"
];

export function PricingPlans({ calendlyUrl }: { calendlyUrl: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [addMaintenance, setAddMaintenance] = useState(false);
  const [analysis, setAnalysis] = useState<{ price: number; label: string; auditId: string } | null>(null);
  const activation = analysis ? { price: analysis.price, label: analysis.label } : PRICE_LEVELS[selectedIndex];

  const handleScroll = () => {
    const hero = document.querySelector("#hero");
    hero?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="mx-auto mt-10 flex flex-col gap-6 md:max-w-5xl md:flex-row">
      <div className="flex-1 rounded-3xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <div className="text-sm font-semibold uppercase tracking-wide text-slate">Comment votre prix est calculé</div>
        {!analysis && (
          <>
            <p className="mt-2 text-sm text-[#94A3B8]">
              Notre agent évalue votre site sur 8 critères techniques. Plus votre site nécessite de corrections, plus le travail est important.
            </p>
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-[#15803D]">● Site bien structuré</p>
                  <p className="text-xs text-[#4ADE80]">Score supérieur à 60 · Quelques optimisations ciblées</p>
                </div>
                <span className="text-base font-black text-[#15803D]">249€ HT</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-[#92400E]">● Optimisations modérées</p>
                  <p className="text-xs text-[#92400E]">Score entre 40 et 60 · Refonte partielle des métadonnées</p>
                </div>
                <span className="text-base font-black text-[#92400E]">390€ HT</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-[#991B1B]">● Refonte complète</p>
                  <p className="text-xs text-[#991B1B]">Score inférieur à 40 · Restructuration technique complète</p>
                </div>
                <span className="text-base font-black text-[#991B1B]">590€ HT</span>
              </div>
            </div>
          </>
        )}        <p className="mt-2 text-sm text-[#94A3B8]">
          Notre agent évalue votre site sur 8 critères techniques. Plus votre site nécessite de corrections, plus le travail est important.
        </p>
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm">
            <div>
              <p className="font-semibold text-[#15803D]">● Site bien structuré</p>
              <p className="text-xs text-[#4ADE80]">Score supérieur à 60 · Quelques optimisations ciblées</p>
            </div>
            <span className="text-base font-black text-[#15803D]">249€ HT</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm">
            <div>
              <p className="font-semibold text-[#92400E]">● Optimisations modérées</p>
              <p className="text-xs text-[#92400E]">Score entre 40 et 60 · Refonte partielle des métadonnées</p>
            </div>
            <span className="text-base font-black text-[#92400E]">390€ HT</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm">
            <div>
              <p className="font-semibold text-[#991B1B]">● Refonte complète</p>
              <p className="text-xs text-[#991B1B]">Score inférieur à 40 · Restructuration technique complète</p>
            </div>
            <span className="text-base font-black text-[#991B1B]">590€ HT</span>
          </div>
        </div>
        {analysis && (
          <div className={`mt-6 rounded-2xl border px-4 py-4 text-sm ${analysis.price <= 249 ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]" : analysis.price <= 390 ? "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]" : "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"}`}>
            <p className="text-sm font-semibold">Votre score : {analysis.label}</p>
            <p className="text-xs text-night/70">Analyse personnalisée basée sur vos données.</p>
          </div>
        )}
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
        <div className="mt-6 rounded-2xl bg-indigo-50 p-4">
          <label className="flex items-center justify-between text-sm font-semibold text-night" htmlFor="maintenance">
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                id="maintenance"
                checked={addMaintenance}
                onChange={(event) => setAddMaintenance(event.target.checked)}
                className="h-4 w-4 accent-[#6366F1]"
              />
              Ajouter la maintenance
            </span>
            <span className="text-sm text-slate">+79€ HT/mois</span>
          </label>
          <p className="mt-1 ml-6 text-xs text-slate">Monitoring mensuel · Mises à jour · Alertes score · Sans engagement</p>
        </div>
        {!analysis && <p className="mt-4 text-sm italic text-[#94A3B8]">Entrez votre URL pour connaître votre prix exact.</p>}
        <button
          type="button"
          onClick={handleScroll}
          className="mt-4 w-full rounded-xl bg-[#4F46E5] px-5 py-4 text-sm font-semibold text-white shadow-md transition hover:bg-[#4338CA]"
        >
          {analysis ? `Payer ${analysis.price}€ et démarrer →` : "Analyser mon site gratuitement →"}
        </button>
        {!analysis && <p className="mt-2 text-center text-xs text-[#94A3B8]">Prix calculé automatiquement · Aucune CB requise</p>}
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <div className="rounded-3xl bg-[#4F46E5] p-6 text-white shadow-lg">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">Maintenance seule</p>
          <p className="mt-2 text-4xl font-black">
            79€ <span className="text-lg font-semibold text-white/80">/mois</span>
          </p>
          <p className="text-sm text-white/70">Sans engagement</p>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            {maintenanceFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-white" />
                {feature}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-white/60">Peut être ajoutée à tout moment après votre activation.</p>
          <button
            type="button"
            onClick={handleScroll}
            className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-accent"
          >
            Ajouter après mon audit →
          </button>
        </div>

        <div className="flex items-center justify-between rounded-3xl border border-dashed border-[#C7D2FE] bg-[#F8F9FF] p-6">
          <div>
            <p className="text-base font-bold text-night">Une question ?</p>
            <p className="text-sm text-slate">Appel gratuit · 20 min</p>
            <p className="text-xs text-[#94A3B8]">⏱ Disponible sous 24h</p>
          </div>
          <Link
            href={calendlyUrl}
            target="_blank"
            className="rounded-lg border border-accent px-5 py-2 text-sm font-semibold text-accent"
          >
            Réserver →
          </Link>
        </div>
      </div>
    </div>
  );
}
