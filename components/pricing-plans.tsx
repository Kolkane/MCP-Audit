"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

const activationOptions = [
  { label: "Score >60", note: "Site bien structuré", price: 249, color: "text-green-600" },
  { label: "Score 40-60", note: "Optimisations modérées", price: 390, color: "text-orange-500" },
  { label: "Score <40", note: "Refonte complète", price: 590, color: "text-red-600" }
];

const maintenanceFeatures = [
  "Monitoring visibilité IA mensuel",
  "Mises à jour automatiques",
  "Alertes + rapport mensuel détaillé"
];

export function PricingPlans({ calendlyUrl }: { calendlyUrl: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [addMaintenance, setAddMaintenance] = useState(false);
  const activation = activationOptions[selectedIndex];

  const handleScroll = () => {
    const hero = document.querySelector("#hero");
    hero?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="mx-auto mt-10 flex flex-col gap-6 md:max-w-5xl md:flex-row">
      <div className="flex-1 rounded-3xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <div className="text-sm font-semibold uppercase tracking-wide text-slate">Mise en conformité</div>
        <h3 className="mt-2 text-4xl font-black text-night">À partir de {activation.price}€ HT</h3>
        <p className="text-sm italic text-slate">Calculé selon votre score</p>
        <div className="mt-4 space-y-2 text-xs text-[#94A3B8]">
          {activationOptions.map((option, idx) => (
            <button
              key={option.label}
              onClick={() => setSelectedIndex(idx)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
                idx === selectedIndex ? "bg-[#F8F9FF]" : "bg-transparent"
              }`}
            >
              <span className="font-semibold text-night">{option.label}</span>
              <span className={`${option.color}`}>{option.price}€ · {option.note}</span>
            </button>
          ))}
        </div>
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
        <div className="mt-6 border-t border-indigo-100 pt-4 text-sm text-slate">
          {!addMaintenance ? (
            <>
              <p>Total aujourd'hui :</p>
              <p className="text-2xl font-black text-night">{activation.price}€ HT</p>
            </>
          ) : (
            <>
              <p>Aujourd'hui :</p>
              <p className="text-2xl font-black text-night">{activation.price}€ HT</p>
              <p className="text-sm font-semibold text-accent">Puis 79€ HT/mois</p>
              <p className="text-xs text-[#94A3B8]">Sans engagement — résiliable en 1 clic</p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={handleScroll}
          className="mt-4 w-full rounded-xl bg-[#4F46E5] px-5 py-4 text-sm font-semibold text-white shadow-md transition hover:bg-[#4338CA]"
        >
          Analyser mon site gratuitement →
        </button>
        <p className="mt-2 text-center text-xs text-[#94A3B8]">Prix exact affiché après analyse de votre URL</p>
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
