"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";

import { AnalyzeResponse } from "@/components/hero-analyzer-context";
import { MAINTENANCE_PRICE } from "@/lib/pricing";

type Props = {
  result: AnalyzeResponse;
  checkoutLoading: "activation" | "maintenance" | null;
  onCheckout: (withMaintenance: boolean) => Promise<void>;
};

const DELIVERABLES = [
  "Schema.org JSON-LD généré",
  "Fichier llms.txt optimisé",
  "Métadonnées corrigées",
  "Rapport PDF complet"
];

export function BlockConversion({ result, checkoutLoading, onCheckout }: Props) {
  const [withMaintenance, setWithMaintenance] = useState(false);

  const totalToday = useMemo(() => {
    const maintenance = withMaintenance ? MAINTENANCE_PRICE : 0;
    return (result.priceActivation ?? 0) + maintenance;
  }, [withMaintenance, result.priceActivation]);

  const formattedTotal = useMemo(() => new Intl.NumberFormat("fr-FR").format(totalToday), [totalToday]);
  const formattedActivation = useMemo(
    () => new Intl.NumberFormat("fr-FR").format(result.priceActivation ?? 0),
    [result.priceActivation]
  );

  const critiques = result.corrections?.filter((c) => c.impact === "critique").length ?? 0;
  const explanation =
    critiques >= 2
      ? "Restructuration technique requise pour rendre votre site lisible par les IA."
      : "Optimisations ciblées pour améliorer votre visibilité GEO.";

  const handleCheckout = () => {
    if (checkoutLoading) return;
    void onCheckout(withMaintenance);
  };

  return (
    <section className="bg-[#0F172A] rounded-3xl p-8 flex flex-col md:flex-row gap-10 items-start text-white">
      <div className="flex-1">
        <p className="text-white/30 text-xs uppercase tracking-widest mb-4">VOTRE MISE EN CONFORMITÉ GEO</p>
        <p className="text-6xl font-black leading-none">
          {formattedActivation}€ <span className="text-2xl text-white/30 ml-2">HT</span>
        </p>
        <p className="text-white/50 text-sm mt-4 leading-relaxed max-w-xs">{explanation}</p>
        <div className="mt-5 bg-white/5 rounded-2xl p-4 border border-white/5">
          <p className="text-white/30 text-xs leading-relaxed">
            Les agences GEO facturent entre 1 500€ et 3 000€ HT. Agentable livre sous 48h.
          </p>
        </div>
      </div>

      <div className="flex-1">
        <p className="text-white/30 text-xs uppercase tracking-widest mb-4">Inclus</p>
        {DELIVERABLES.map((item) => (
          <div key={item} className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-indigo-500/20 border border-indigo-500/20 rounded-xl flex items-center justify-center">
              <span className="text-indigo-400 text-sm">✓</span>
            </div>
            <span className="text-white/70 text-sm">{item}</span>
          </div>
        ))}
        <div className="border-t border-white/10 my-5" />
        <label className="flex items-start gap-3 cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/8 transition">
          <input
            type="checkbox"
            className="mt-0.5 w-5 h-5 accent-indigo-500"
            checked={withMaintenance}
            onChange={(event) => setWithMaintenance(event.target.checked)}
          />
          <div className="flex-1">
            <p className="text-white/80 font-semibold text-sm">Maintenance mensuelle</p>
            <p className="text-white/30 text-xs mt-1">+79€ HT/mois · sans engagement</p>
            <div className="mt-3 bg-white/5 rounded-xl p-3 flex justify-between items-center">
              <div>
                <p className="text-white/40 text-sm">Total :</p>
                {withMaintenance && <p className="text-white/30 text-xs">+ 79€/mois</p>}
              </div>
              <p className="text-white font-black text-xl">{formattedTotal}€ HT</p>
            </div>
          </div>
        </label>
      </div>

      <div className="w-64 flex flex-col gap-3">
        <button
          className={clsx(
            "rounded-2xl py-5 w-full text-center font-bold text-base transition shadow-lg",
            checkoutLoading === "activation"
              ? "bg-white/60 text-indigo-400 cursor-not-allowed"
              : "bg-white text-indigo-700 hover:bg-indigo-50"
          )}
          disabled={checkoutLoading === "activation"}
          onClick={handleCheckout}
        >
          {checkoutLoading === "activation" ? "Redirection…" : `Payer ${formattedTotal}€ →`}
        </button>
        <button className="bg-white/10 text-white border border-white/20 rounded-2xl py-4 w-full text-center text-sm hover:bg-white/15 transition">
          Recevoir ce rapport par email →
        </button>
        <div className="flex flex-col gap-1 mt-2 text-white/25 text-xs text-center">
          <p>🔒 Paiement sécurisé Stripe</p>
          <p>📄 Facture HT disponible</p>
          <p>↩ Remboursement si non livré</p>
        </div>
      </div>
    </section>
  );
}
