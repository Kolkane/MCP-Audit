"use client";

import clsx from "clsx";

import { AnalyzeResponse } from "@/components/hero-analyzer-context";

type CriteriaDetails = NonNullable<AnalyzeResponse["criteresDetail"]>;
type CriteriaKey = keyof CriteriaDetails;

const LABELS: Record<string, string> = {
  schemaOrg: "Schema.org",
  nap: "Données NAP",
  metadata: "Métadonnées",
  faq: "FAQ structurée",
  vitesse: "Vitesse & accessibilité",
  citations: "Autorité & citations"
};

type Props = {
  result: AnalyzeResponse;
};

export function BlockCriteres({ result }: Props) {
  const criteres = (result.criteresDetail ?? {}) as CriteriaDetails;

  const formatScoreColor = (score: number) =>
    score < 9 ? "text-red-500" : score < 14 ? "text-orange-500" : "text-green-600";

  const formatBadgeClass = (score: number) =>
    score < 9
      ? "bg-red-50 text-red-600"
      : score < 14
        ? "bg-orange-50 text-orange-600"
        : "bg-green-50 text-green-600";

  const formatBadgeText = (score: number) =>
    score < 9 ? "✗ Action requise" : score < 14 ? "⚠ À améliorer" : "✓ Correct";

  const buildDetailList = (key: CriteriaKey) => {
    const detail = criteres[key] as CriteriaDetails[CriteriaKey] & Record<string, any>;
    if (!detail) return [];

    const collected: string[] = [];
    if (Array.isArray(detail.found) && detail.found.length) {
      collected.push(...detail.found.map((item: string) => `• ${item}`));
    }
    if (Array.isArray(detail.missing) && detail.missing.length) {
      collected.push(...detail.missing.map((item: string) => `✗ ${item}`));
    }
    if (detail.hasPhone) collected.push("✓ Téléphone détecté");
    if (detail.hasEmail) collected.push("✓ Email détecté");
    if (detail.hasAddress) collected.push("✓ Adresse détectée");
    if (detail.note) collected.push(detail.note);

    return collected.slice(0, 3);
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="bg-white rounded-3xl p-8 border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">ANALYSE PAR CRITÈRE</h2>
          <span className="bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5 text-sm font-bold text-slate-600">{result.score}/100</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.entries(criteres) as [CriteriaKey, CriteriaDetails[CriteriaKey]][]).map(([key, value]) => {
            const score = value?.score ?? 0;
            const color = formatScoreColor(score);
            const barColor = score < 9 ? "#EF4444" : score < 14 ? "#F97316" : "#22C55E";
            const detailList = buildDetailList(key);
            return (
              <div key={key} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-800">{LABELS[key as string] ?? key}</span>
                  <span className={clsx("text-sm font-bold", color)}>{score}/20</span>
                </div>
                <div className="mt-2 bg-slate-200 h-2 rounded-full">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${(score / 20) * 100}%`, background: barColor }}
                  />
                </div>
                <div className="mt-2 text-xs text-slate-500 space-y-1">
                  {detailList.length > 0 ? detailList.map((item, index) => <p key={index}>{item}</p>) : <p>Pas de données supplémentaires</p>}
                </div>
                <span className={clsx("mt-2 inline-flex text-xs px-2 py-1 rounded-full", formatBadgeClass(score))}>{formatBadgeText(score)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white rounded-3xl p-8 border border-slate-100 flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">PERTE MENSUELLE</p>
          <p className="text-5xl font-black text-red-500">-{result.valeurPerdue ?? 0}€</p>
          <p className="text-slate-400 text-sm mt-2">Soit -{(result.valeurPerdue ?? 0) * 12}€/an</p>
        </div>
        <div className="flex-1 bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
          <p className="text-2xl font-black text-green-600">ROI +{(result.valeurPerdue ?? 0) * 12 - (result.priceActivation ?? 0)}€</p>
          <p className="text-sm text-green-500 mt-1">Rentabilisé mois 1 ✓</p>
        </div>
      </section>
    </div>
  );
}
