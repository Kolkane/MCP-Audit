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

  const failingCriteria = Object.entries(criteresDetail ?? {})
    .filter(([key, value]) => key in CRITERIA_META && value.score < 10).length;

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

  const criteres = (Object.entries(CRITERIA_META) as [keyof CriteriaDetails, (typeof CRITERIA_META)[keyof typeof CRITERIA_META]][]).map(([key, meta]) => {
    const detail = criteresDetail?.[key];
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
      lines: buildLines(key, detail)
    };
  });

  const corrections = result.corrections ?? [];
  const includedItems = ["Schema.org JSON-LD généré", "Fichier llms.txt optimisé", "Métadonnées corrigées", "Rapport PDF complet"];
  const guarantees = ["Paiement sécurisé Stripe", "Facture HT disponible", "Remboursement si non livré"];

  return (
    <div className="mx-auto mt-6 flex w-full max-w-4xl flex-col gap-6 px-6">
      {/* Bloc 1 */}
      <motion.section {...blockMotion(0)} className="flex flex-col gap-6 overflow-hidden rounded-3xl border border-white/10 bg-[#0F172A] p-6 text-white md:flex-row">
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
            <span className="uppercase tracking-[0.3em]">Audit GEO</span>
            <span className="font-mono max-w-[220px] truncate text-white/70">{result.url ?? "URL analysée"}</span>
          </div>
          <p className={clsx("text-5xl font-black leading-none", result.score > 60 ? "text-emerald-400" : result.score >= 40 ? "text-orange-400" : "text-red-400")}>{animatedScore}</p>
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
            <span className={clsx("rounded-full border px-3 py-1", result.score > 60 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : result.score >= 40 ? "border-orange-500/30 bg-orange-500/10 text-orange-300" : "border-red-500/30 bg-red-500/10 text-red-300")}>{result.score > 60 ? "Bien structuré" : result.score >= 40 ? "À optimiser" : "Score critique"}</span>
            <span className={clsx("text-xs", priorityColor)}>{priority}</span>
            <span className="text-xs text-white/50">Critères KO : {failingCriteria}/6</span>
          </div>
          <p className="text-sm text-white/65 leading-relaxed">{explanation}</p>
        </div>
        <div className="relative flex w-full flex-shrink-0 flex-col gap-3 overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-4 sm:w-64">
          <div className="space-y-2 text-sm text-white/70">
            <p className="flex items-center justify-between"><span>Score</span><span>{result.score}/100</span></p>
            <p className="flex items-center justify-between"><span>Perte</span><span>-{formattedMonthlyLoss}€/mois</span></p>
            <p className="flex items-center justify-between"><span>Priorité</span><span className={clsx("font-semibold", priorityColor)}>{priority}</span></p>
          </div>
          <div className="absolute inset-y-0 right-0 hidden h-full w-24 rounded-l-full bg-white/10 md:block" />
        </div>
      </motion.section>

      {/* Bloc 2 */}
      <motion.section {...blockMotion(0.12)} className="space-y-4">
        <div className="rounded-3xl border border-slate-100 bg-white p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="uppercase tracking-[0.3em]">Analyse par critère</span>
            <span>Lecture complète du site</span>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {criteres.map((criterion, index) => (
              <div key={criterion.key} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={clsx("flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg", criterion.iconTone)}>
                      <criterion.meta.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{criterion.meta.label}</span>
                  </div>
                  <span className={clsx("text-sm font-semibold", criterion.score < 9 ? "text-red-500" : criterion.score < 14 ? "text-orange-500" : "text-emerald-500")}>{criterion.score}/20</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-200">
                  <motion.div
                    className={clsx("h-full rounded-full", criterion.score < 9 ? "bg-gradient-to-r from-red-400 to-red-500" : criterion.score < 14 ? "bg-gradient-to-r from-orange-400 to-orange-500" : "bg-gradient-to-r from-emerald-400 to-emerald-500")}
                    initial={{ width: 0 }}
                    animate={{ width: `${criterion.progress}%` }}
                    transition={{ duration: 0.8, delay: index * 0.08 }}
                  />
                </div>
                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  {criterion.lines.slice(0, 3).map((line, lineIndex) => (
                    <p key={lineIndex} className={clsx(line.type === "positive" ? "text-emerald-600" : line.type === "negative" ? "text-red-500" : "text-slate-500")}>{line.text}</p>
                  ))}
                </div>
                <span className={clsx("mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", criterion.statusColor)}>{criterion.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-red-950/30 bg-red-950 p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-200/80">Coût immédiat</p>
              <p className="mt-2 text-3xl font-black text-red-200">-{formattedMonthlyLoss}€ / mois</p>
              <p className="text-sm text-white/60">Chaque mois sans optimisation</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/60">Sur 12 mois</p>
              <p className="text-2xl font-black text-white">-{formattedYearlyLoss}€</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Bloc 3 */}
      <motion.section {...blockMotion(0.24)} className="rounded-3xl border border-slate-100 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {corrections.length === 0 ? (
            <p className="text-sm text-slate-600">Aucune correction spécifique requise.</p>
          ) : (
            corrections.map((correction, index) => (
              <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{correction.probleme}</p>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">{correction.solution}</p>
                <span className={clsx("mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                  correction.impact === "critique" ? "bg-red-100 text-red-600" : correction.impact === "important" ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600")}> {correction.impact === "critique" ? "🔴 Critique" : correction.impact === "important" ? "🟠 Important" : "🔵 Utile"}</span>
              </div>
            ))
          )}
        </div>
      </motion.section>

      {/* Bloc 4 */}
      <motion.section {...blockMotion(0.36)} className="space-y-4 rounded-3xl border border-white/10 bg-[#0F172A] p-6 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">Votre mise en conformité GEO</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-5xl font-black text-white">{formattedActivation}€</p>
              <span className="text-xl text-white/30">HT</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-white/80">
            {includedItems.map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-full border border-white/20 px-3 py-1">
                <Check className="h-3 w-3 text-indigo-200" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <label className="flex items-start gap-3 rounded-2xl border border-white/20 bg-white/5 p-4 text-sm text-white/80">
          <input
            type="checkbox"
            checked={addMaintenance}
            onChange={(event) => setAddMaintenance(event.target.checked)}
            className="mt-1 h-5 w-5 flex-shrink-0 accent-indigo-400"
          />
          <div>
            <p className="font-semibold text-white">Maintenance mensuelle</p>
            <p className="text-xs text-white/60">+79€ HT/mois · sans engagement</p>
          </div>
        </label>
        <div className="flex flex-col gap-3 text-sm text-white/80 sm:flex-row sm:items-center sm:justify-between">
          <p>Total aujourd'hui : <span className="text-xl font-semibold text-white">{formattedTotalToday}€ HT</span></p>
          {addMaintenance && <p className="text-xs text-white/60">+ 79€/mois</p>}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => onCheckout(addMaintenance)}
            className="w-full rounded-2xl bg-indigo-500 px-6 py-4 text-base font-bold text-white shadow-[0_0_40px_rgba(99,102,241,0.4)] transition hover:bg-indigo-400"
          >
            Démarrer maintenant →
          </button>
          <button
            type="button"
            onClick={() => setShowEmailForm((prev) => !prev)}
            className="w-full rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-sm font-semibold text-white/80 transition hover:bg-white/10"
          >
            Recevoir ce rapport par email →
          </button>
        </div>
        <AnimatePresence initial={false}>
          {showEmailForm && (
            <motion.form
              key="email-form"
              onSubmit={handleSendEmail}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="votre@email.fr"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-white/40"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-500/80 px-4 py-2.5 text-sm font-semibold text-white"
              >
                {emailStatus === "loading" ? "Envoi..." : "Envoyer le rapport →"}
              </button>
              {emailStatus === "success" && <p className="text-center text-xs text-white/70">✓ Rapport envoyé !</p>}
              {emailStatus === "error" && <p className="text-center text-xs text-red-300">Erreur lors de l'envoi.</p>}
            </motion.form>
          )}
        </AnimatePresence>
        <div className="space-y-2 text-xs text-white/40">
          {guarantees.map((item) => (
            <div key={item} className="flex items-center gap-2">
              <span>•</span>
              {item}
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}

function Statistics({ label, value, tone }: { label: string; value: string; tone?: "red" | "indigo" }) {
  return (
    <div className={clsx("rounded-2xl border px-4 py-3 text-left", tone === "red" ? "border-red-500/30 bg-red-500/10" : tone === "indigo" ? "border-indigo-500/30 bg-indigo-500/10" : "border-white/10 bg-white/5")}>