"use client";

import clsx from "clsx";

import { AnalyzeResponse } from "@/components/hero-analyzer-context";

type Props = {
  result: AnalyzeResponse;
};

const styles = {
  critique: {
    card: "bg-red-50/30 border-red-100",
    badge: "bg-red-100 text-red-700",
    number: "bg-red-100 text-red-600",
    label: "🔴 Critique"
  },
  important: {
    card: "bg-orange-50/30 border-orange-100",
    badge: "bg-orange-100 text-orange-700",
    number: "bg-orange-100 text-orange-600",
    label: "🟠 Important"
  },
  utile: {
    card: "bg-blue-50/30 border-blue-100",
    badge: "bg-blue-100 text-blue-700",
    number: "bg-blue-100 text-blue-600",
    label: "🔵 Utile"
  }
} as const;

export function BlockCorrections({ result }: Props) {
  const corrections = result.corrections ?? [];
  if (!corrections.length) return null;

  return (
    <section className="bg-white rounded-3xl p-8 border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">CE QU'ON VA CORRIGER</h2>
          <p className="text-sm text-slate-400 mt-1">Livraison sous 48h après paiement</p>
        </div>
        <span className="bg-indigo-50 border border-indigo-100 rounded-full px-4 py-2 text-indigo-600 text-sm font-semibold">
          {corrections.length} corrections · {result.priceActivation}€ HT
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {corrections.slice(0, 4).map((correction, i) => {
          const impact = correction.impact as keyof typeof styles;
          const impactStyles = styles[impact] ?? styles.utile;

          return (
            <div key={i} className={clsx("rounded-2xl p-5 border", impactStyles.card)}>
              <div className={clsx("w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black mb-3", impactStyles.number)}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <p className="text-sm font-bold text-slate-800 mb-2">{correction.probleme}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{correction.solution}</p>
              <span className={clsx("mt-3 inline-block text-xs px-3 py-1 rounded-full font-semibold", impactStyles.badge)}>
                {impactStyles.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
