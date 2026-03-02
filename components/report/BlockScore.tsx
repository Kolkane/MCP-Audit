"use client";

import clsx from "clsx";
import { useMemo } from "react";
import { Gauge as GaugeIcon } from "lucide-react";

import { AnalyzeResponse } from "@/components/hero-analyzer-context";

type Props = {
  result: AnalyzeResponse;
};

export function BlockScore({ result }: Props) {
  const priority = result.score < 40 ? "Critique" : result.score < 60 ? "Modérée" : "Faible";
  const priorityColor = priority === "Critique" ? "text-red-500" : priority === "Modérée" ? "text-orange-500" : "text-emerald-500";

  const explanation = useMemo(() => {
    if (result.explanation) return result.explanation;
    const fallbacks = result.issues ?? [];
    if (!fallbacks.length) return "Votre site présente plusieurs lacunes qui empêchent les IA de le recommander.";
    return fallbacks.join(" · ");
  }, [result.explanation, result.issues]);

  const failingCriteria = Object.values(result.criteresDetail ?? {}).filter((critere) => (critere as any)?.score < 10).length;

  return (
    <section className="flex flex-col gap-6 overflow-hidden rounded-3xl bg-[#0F172A] p-8 text-white md:flex-row">
      <div className="flex-1">
        <p className="text-white/30 text-xs tracking-widest mb-4">AUDIT GEO</p>
        <div className="flex items-end gap-2">
          <span
            className={clsx(
              "text-7xl font-black leading-none",
              result.score < 40 ? "text-[#F87171]" : result.score < 60 ? "text-[#FB923C]" : "text-[#4ADE80]"
            )}
          >
            {result.score}
          </span>
          <span className="text-2xl text-white/20 mb-2">/100</span>
        </div>
        <p className="text-white/40 text-sm mt-4 leading-relaxed max-w-sm">{explanation}</p>
      </div>

      <div className="w-48 flex flex-col gap-3">
        <Metric label="Critères en échec" value={`${failingCriteria}/6`} />
        <Metric label="Perte estimée" value={`-${result.valeurPerdue ?? 0}€/mois`} />
        <Metric label="Priorité" value={priority} extraClass={priorityColor} />
      </div>

      <div className="hidden md:block w-40">
        <ScoreGauge value={result.score} />
      </div>
    </section>
  );
}

function Metric({ label, value, extraClass }: { label: string; value: string; extraClass?: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-4">
      <p className="text-white/30 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className={clsx("text-white font-bold text-lg", extraClass)}>{value}</p>
    </div>
  );
}

function ScoreGauge({ value }: { value: number }) {
  const ratio = Math.min(100, Math.max(0, value)) / 100;
  const dash = 2 * Math.PI * 55;
  const severity = value < 40 ? "#F87171" : value < 60 ? "#FB923C" : "#4ADE80";
  return (
    <svg width="120" height="120" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r="55" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
      <circle
        cx="70"
        cy="70"
        r="55"
        fill="none"
        stroke={severity}
        strokeWidth="12"
        strokeDasharray={dash}
        strokeDashoffset={dash - dash * ratio}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
      />
    </svg>
  );
}
