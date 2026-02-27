"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { Check, Database, FileText, Gauge, Mail, MapPin, MessageSquare, Share2 } from "lucide-react";

import { AnalyzeResponse } from "@/components/hero-analyzer-context";
import { MAINTENANCE_PRICE } from "@/lib/pricing";

const CRITERIA_META = {
  schemaOrg: { label: "Schema.org", icon: Database },
  nap: { label: "Données NAP", icon: MapPin },
  metadata: { label: "Métadonnées", icon: FileText },
  faq: { label: "FAQ structurée", icon: MessageSquare },
  vitesse: { label: "Vitesse & accessibilité", icon: Gauge },
  citations: { label: "Autorité & citations", icon: Share2 }
} as const;

type CriteriaDetails = NonNullable<AnalyzeResponse["criteresDetail"]>;

type ResultReportProps = {
  result: AnalyzeResponse;
  checkoutLoading: "activation" | "maintenance" | null;
  onCheckout: (withMaintenance: boolean) => Promise<void>;
};

const blockMotion = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay }
});

export function ResultReport({ result, checkoutLoading, onCheckout }: ResultReportProps) {
  const [addMaintenance, setAddMaintenance] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    setAddMaintenance(false);
    setShowEmailForm(false);
    setEmail("");
    setEmailStatus("idle");
  }, [result.auditId]);

  const criteresDetail = result.criteresDetail;
  const monthlyLoss = result.valeurPerdue ?? Math.max(0, Math.round((100 - result.score) * 120));
  const yearlyLoss = monthlyLoss * 12;
  const formattedMonthlyLoss = useMemo(() => new Intl.NumberFormat("fr-FR").format(monthlyLoss), [monthlyLoss]);
  const formattedYearlyLoss = useMemo(() => new Intl.NumberFormat("fr-FR").format(yearlyLoss), [yearlyLoss]);

  const maintenancePrice = result.maintenancePrice ?? MAINTENANCE_PRICE;
  const totalToday = addMaintenance ? result.priceActivation + maintenancePrice : result.priceActivation;
  const formattedTotalToday = useMemo(() => new Intl.NumberFormat("fr-FR").format(totalToday), [totalToday]);
  const formattedActivation = useMemo(() => new Intl.NumberFormat("fr-FR").format(result.priceActivation), [result.priceActivation]);

  const failingCriteria = Object.entries(criteresDetail ?? {}).filter(([key, value]) => key in CRITERIA_META && value.score < 10).length;
  const priority = failingCriteria >= 4 || monthlyLoss > 2500 ? "Critique" : failingCriteria >= 2 ? "Modérée" : "Faible";
  const priorityColor = priority === "Critique" ? "text-red-500" : priority === "Modérée" ? "text-orange-500" : "text-emerald-500";

  const animatedScore = useCountUp(result.score, 1200);
  const animatedMonthlyLoss = useCountUp(monthlyLoss, 1000);

  const explanation = useMemo(() => {
    if (result.explanation) return result.explanation;
    const fallbacks = result.issues ?? [];
    if (!fallbacks.length) {
      return "Votre site présente plusieurs lacunes qui empêchent les IA de le recommander.";
    }
    return fallbacks.join(" · ");
  }, [result.explanation, result.issues]);

  const criteres = Object.entries(CRITERIA_META).map(([key, meta]) => {
    const detail = criteresDetail?.[key as keyof CriteriaDetails];
    const score = detail?.score ?? 10;
    const status = score < 9 ? "✗ Action requise" : score < 14 ? "⚠ À améliorer" : "✓ Correct";
    const statusColor = score < 9 ? "bg-red-50 text-red-600" : score < 14 ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600";
    const iconTone = score < 9 ? "bg-red-100 text-red-600" : score < 14 ? "bg-orange-100 text-orange-600" : "bg-emerald-100 text-emerald-600";
    return {
      key,
      meta,
      detail,
      score,
      status,
      statusColor,
      iconTone,
      progress: Math.min(100, (score / 20) * 100),
      lines: buildLines(key as keyof CriteriaDetails, detail)
    };
  });

  const corrections = result.corrections ?? [];
  const includedItems = [
    "Schema.org JSON-LD généré",
    "Fichier llms.txt optimisé",
    "Métadonnées corrigées",
    "Rapport PDF complet"
  ];

  const conversionCopy = corrections.filter((c) => c.impact === "critique").length >= 3
    ? "Restructuration technique complète requise."
    : corrections.filter((c) => c.impact === "critique").length >= 1
    ? "Optimisations ciblées sur vos points critiques."
    : "Quelques ajustements techniques suffisent.";

  const guarantees = ["Paiement sécurisé Stripe", "Facture HT disponible", "Remboursement si non livré"];

  return (
    <div className="mx-auto mt-8 flex w-full max-w-5xl flex-col gap-6 px-6">
      <motion.section {...blockMotion(0)} className="overflow-hidden rounded-3xl border border-white/10 bg-[#0F172A] p-6 text-white">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-white/50">
              <span className="uppercase tracking-[0.3em]">Audit GEO</span>
              <span className="font-mono max-w-[200px] truncate text-white/70">{result.url ?? "URL analysée"}</span>
            </div>
            <div className="mt-4 flex items-end gap-3">
              <span className={clsx("text-6xl sm:text-7xl font-black leading-none", result.score > 60 ? "text-emerald-400" : result.score >= 40 ? "text-orange-400" : "text-red-400")}>{animatedScore}</span>
              <span className="mb-4 text-2xl text-white/30">/100</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-semibold">
              <span className={clsx("rounded-full border px-4 py-1.5", result.score > 60 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : result.score >= 40 ? "border-orange-500/30 bg-orange-500/10 text-orange-300" : "border-red-500/30 bg-red-500/10 text-red-300")}>{result.score > 60 ? "Bien structuré" : result.score >= 40 ? "À optimiser" : "Score critique"}</span>
              <span className={clsx("text-xs", priorityColor)}>Priorité : {priority}</span>
              <span className="text-xs text-white/40">Critères KO : {failingCriteria}/6</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/60">{explanation}</p>
          </div>
          <div className="grid flex-shrink-0 grid-cols-2 gap-3 text-center text-sm">
            <Stat label="Score" value={`${result.score}/100`} />
            <Stat label="Perte estimée" value={`-${formattedMonthlyLoss}€/mois`} tone="red" />
            <Stat label="Niveau" value={result.level ?? "N/A"} tone="indigo" />
            <Stat label="Perte annuelle" value={`-${formattedYearlyLoss}€`} tone="red" />
          </div>
          <div className="hidden w-[140px] overflow-hidden md:flex flex-col items-center justify-center">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="55" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
              <circle
                cx="70"
                cy="70"
                r="55"
                fill="none"
                stroke={result.score > 60 ? "#4ADE80" : result.score >= 40 ? "#FB923C" : "#F87171"}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={345.6}
                strokeDashoffset={345.6 - (345.6 * Math.min(100, Math.max(0, result.score))) / 100}
                transform="rotate(-90 70 70)"
              />
            </svg>
          </div>
        </div>
      </motion.section>

      <motion.section {...blockMotion(0.12)} className="rounded-3xl border border-slate-100 bg-white p-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Analyse par critère</p>
            <p className="text-sm text-slate-500">Lecture complète du site</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-semibold text-slate-600">{result.score}/100</span>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {criteres.map((criterion, index) => (
            <div key={criterion.key} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={clsx("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl", criterion.iconTone)}>
                    <criterion.meta.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{criterion.meta.label}</span>
                </div>
                <span className={clsx("text-sm font-semibold", criterion.score < 9 ? "text-red-500" : criterion.score < 14 ? "text-orange-500" : "text-emerald-500")}>{criterion.score}/20</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-200">
                <motion.div
                  className={clsx("h-2 rounded-full", criterion.score < 9 ? "bg-gradient-to-r from-red-400 to-red-500" : criterion.score < 14 ? "bg-gradient-to-r from-orange-400 to-orange-500" : "bg-gradient-to-r from-emerald-400 to-emerald-500")}
                  initial={{ width: 0 }}
                  animate={{ width: `${criterion.progress}%` }}
                  transition={{ duration: 0.8, delay: index * 0.08 }}
                />
              </div>
              <div className="mt-3 space-y-1 text-xs text-slate-600">
                {criterion.lines.map((line, lineIndex) => (
                  <p key={lineIndex} className={clsx(line.type === "positive" ? "text-emerald-600" : line.type === "negative" ? "text-red-500" : "text-slate-500")}>{line.text}</p>
                ))}
              </div>
              <span className={clsx("mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", criterion.statusColor)}>{criterion.status}</span>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section {...blockMotion(0.24)} className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-red-900/40 bg-red-950 p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-300/80">Coût immédiat</p>
          <p className="mt-4 text-4xl font-black">-{formattedMonthlyLoss}€</p>
          <p className="text-sm text-white/60">Chaque mois sans optimisation</p>
          <div className="my-6 border-t border-white/10" />
          <div className="flex items-center justify-between text-sm text-white/70">
            <span>Sur 12 mois</span>
            <span className="text-2xl font-black text-white">-{formattedYearlyLoss}€</span>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Ce qu'on va corriger</h3>
            <span className="text-sm text-slate-500">Livraison sous 48h</span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {corrections.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune correction spécifique requise.</p>
            ) : (
              corrections.map((correction, index) => {
                const palette = correction.impact === "critique"
                  ? { card: "border-red-100 bg-red-50", badge: "bg-red-100 text-red-700", number: "bg-red-100 text-red-600", label: "🔴 Critique" }
                  : correction.impact === "important"
                  ? { card: "border-orange-100 bg-orange-50", badge: "bg-orange-100 text-orange-700", number: "bg-orange-100 text-orange-600", label: "🟠 Important" }
                  : { card: "border-blue-100 bg-blue-50", badge: "bg-blue-100 text-blue-700", number: "bg-blue-100 text-blue-600", label: "🔵 Utile" };
                return (
                  <div key={index} className={clsx("flex items-start gap-4 rounded-2xl border p-4", palette.card)}>
                    <div className={clsx("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-black", palette.number)}>
                      {(index + 1).toString().padStart(2, "0")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{correction.probleme}</p>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">{correction.solution}</p>
                      <span className={clsx("mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", palette.badge)}>
                        {palette.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </motion.section>

      <motion.section {...blockMotion(0.36)} className="relative grid gap-8 rounded-3xl border border-white/5 bg-[#0F172A] p-6 sm:grid-cols-3 sm:p-10 overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[radial-gradient(circle,_rgba(79,70,229,0.2),_transparent_70%)] blur-3xl" />
        <diventesque";"
