"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import {
  ArrowRight,
  Check,
  Database,
  FileText,
  Gauge,
  Globe,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Share2,
  Sparkles
} from "lucide-react";

import { AnalyzeResponse } from "@/components/hero-analyzer-context";

type CriteriaDetails = NonNullable<AnalyzeResponse["criteresDetail"]>;
import { MAINTENANCE_PRICE } from "@/lib/pricing";

type CriterionKey = keyof CriteriaDetails;

const CRITERIA_META: Record<CriterionKey, { label: string; icon: typeof Database }> = {
  schemaOrg: { label: "Schema.org", icon: Database },
  nap: { label: "Données NAP", icon: MapPin },
  metadata: { label: "Métadonnées", icon: FileText },
  faq: { label: "FAQ structurée", icon: MessageSquare },
  vitesse: { label: "Vitesse & accessibilité", icon: Gauge },
  citations: { label: "Autorité & citations", icon: Share2 }
} as const;

type ResultReportProps = {
  result: AnalyzeResponse;
  checkoutLoading: "activation" | "maintenance" | null;
  onCheckout: (withMaintenance: boolean) => Promise<void>;
};

const motionBase = (delay: number) => ({
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
  const priorityColor = priority === "Critique" ? "text-red-400" : priority === "Modérée" ? "text-orange-400" : "text-green-400";

  const severityColor = result.score > 60 ? "text-[#4ADE80]" : result.score >= 40 ? "text-[#FB923C]" : "text-[#F87171]";

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

  const gradientId = `score-gradient-${result.auditId ?? "current"}`;

  const criteres = Object.entries(CRITERIA_META).map(([key, meta]) => {
    const detail = criteresDetail?.[key as keyof CriteriaDetails];
    const score = detail?.score ?? 10;
    const typedDetail = detail as CriteriaDetails[keyof CriteriaDetails] | undefined;
    const status = score < 9 ? "✗ Action requise" : score < 14 ? "⚠ À améliorer" : "✓ Correct";
    const statusColor = score < 9 ? "bg-red-50 text-red-600" : score < 14 ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600";
    const iconTone = score < 9 ? "bg-red-50 text-red-500" : score < 14 ? "bg-orange-50 text-orange-500" : "bg-green-50 text-green-600";
    return {
      key,
      meta,
      detail,
      score,
      status,
      statusColor,
      iconTone,
      progress: Math.min(100, (score / 20) * 100),
      lines: buildCriterionLines(key as CriterionKey, detail)
    };
  });

  const corrections = result.corrections ?? [];
  const yearlyGain = Math.max(0, yearlyLoss - result.priceActivation);
  const formattedYearlyGain = new Intl.NumberFormat("fr-FR").format(yearlyGain);

  const includedItems = [
    "Schema.org JSON-LD généré",
    "Fichier llms.txt optimisé",
    "Métadonnées corrigées",
    "Rapport PDF complet"
  ];

  const conversionCopy = corrections.filter((c) => c.impact === "critique").length >= 3
    ? "Restructuration technique complète requise. Nous corrigeons les lacunes détectées pour rendre votre site lisible par les IA."
    : corrections.filter((c) => c.impact === "critique").length >= 1
    ? "Optimisations ciblées sur vos points critiques pour améliorer significativement votre visibilité GEO."
    : "Quelques ajustements techniques suffisent pour atteindre l'excellence GEO.";

  const guarantees = [
    "Paiement sécurisé Stripe",
    "Facture HT disponible",
    "Remboursement si non livré"
  ];

  const formattedDate = useMemo(() => new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date()), []);

  const averageScore = 23;
  const scoreRatio = Math.min(100, Math.max(0, result.score)) / 100;

  const handleSendEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !result.url) return;
    setEmailStatus("loading");
    try {
      const payload = {
        firstName: "Audit",
        email,
        website: result.url,
        structure: "Rapport automatique",
        auditId: result.auditId
      };
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("send_error");
      setEmailStatus("success");
    } catch (err) {
      console.error(err);
      setEmailStatus("error");
    }
  };

  return (
    <div className="mx-auto mt-8 flex w-full max-w-5xl flex-col gap-6 px-6">
      {/* Bloc 1 */}
      <motion.section {...motionBase(0)} className="overflow-hidden rounded-3xl border border-white/5 bg-[#0F172A] p-6 sm:p-10 text-white">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <div className="mb-6 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.3em] text-white/30">
              <span>Audit GEO</span>
              <span className="text-white/10">›</span>
              <span className="font-mono text-white/40 max-w-xs truncate">{result.url ?? "URL analysée"}</span>
            </div>
            <div className="flex items-end gap-3">
              <span className={clsx("text-6xl sm:text-7xl leading-none font-black tracking-tighter", severityColor)}>{animatedScore}</span>
              <span className="mb-6 text-3xl text-white/15">/100</span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <span className={clsx(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold",
                result.score > 60
                  ? "border-green-500/20 bg-green-500/10 text-green-400"
                  : result.score >= 40
                  ? "border-orange-500/20 bg-orange-500/10 text-orange-400"
                  : "border-red-500/20 bg-red-500/10 text-red-400"
              )}>
                {result.score > 60 ? "Bien structuré" : result.score >= 40 ? "À optimiser" : "Score critique"}
              </span>
              <span className="h-4 w-px bg-white/10" />
              <span className="text-xs text-white/30">Analysé le {formattedDate}</span>
            </div>
            <p className="mt-6 max-w-md text-base font-light leading-relaxed text-white/40">{explanation}</p>
          </div>

          <div className="space-y-3">
            <MetricCard label="Critères en échec" value={`${failingCriteria} / 6`} valueClassName={priorityColor} />
            <MetricCard label="Perte estimée" value={`-${formattedMonthlyLoss}€ / mois`} valueClassName="text-red-400" />
            <MetricCard label="Priorité" value={priority} valueClassName={priorityColor} />
          </div>

          <div className="hidden max-w-[140px] overflow-hidden md:flex flex-col items-center justify-center">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                  {result.score > 60 ? (
                    <>
                      <stop offset="0%" stopColor="#4ADE80" />
                      <stop offset="100%" stopColor="#22C55E" />
                    </>
                  ) : result.score >= 40 ? (
                    <>
                      <stop offset="0%" stopColor="#FB923C" />
                      <stop offset="100%" stopColor="#F97316" />
                    </>
                  ) : (
                    <>
                      <stop offset="0%" stopColor="#F87171" />
                      <stop offset="100%" stopColor="#DC2626" />
                    </>
                  )}
                </linearGradient>
              </defs>
              <circle cx="70" cy="70" r="55" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
              <motion.circle
                cx="70"
                cy="70"
                r="55"
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={345.6}
                strokeDashoffset={345.6}
                transform="rotate(-90 70 70)"
                animate={{ strokeDashoffset: 345.6 - 345.6 * scoreRatio }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              <text x="70" y="66" textAnchor="middle" className="text-3xl font-black" fill="white">
                {result.score}
              </text>
              <text x="70" y="84" textAnchor="middle" fill="rgba(255,255,255,0.35)" className="text-xs">
                GEO Score
              </text>
            </svg>
            <div className="mt-4 w-full">
              <div className="mb-1.5 flex items-center justify-between text-xs text-white/30">
                <span>Moyenne PME FR</span>
                <span>{averageScore}/100</span>
              </div>
              <div className="relative h-1.5 rounded-full bg-white/5">
                <div className="h-full rounded-full bg-white/30" style={{ width: "23%" }} />
                <div
                  className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-indigo-400"
                  style={{ left: `${scoreRatio * 100}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-white/30 text-right">Votre score</p>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section {...motionBase(0.12)}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-3xl border border-slate-100 bg-white p-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Analyse par critère</p>
                <p className="text-xs text-slate-400">Lecture complète du site</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-bold text-slate-600">
                {result.score}/100
              </span>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {criteres.map((criterion, index) => (
                <div
                  key={criterion.key}
                  className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-slate-200 min-h-[220px]"
                >
                  <div className="flex items-center gap-3">
                    <div className={clsx("flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg", criterion.iconTone)}>
                      <criterion.meta.icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                      <p>{criterion.meta.label}</p>
                      <span
                        className={clsx(
                          "text-sm font-semibold",
                          criterion.score < 9 ? "text-red-500" : criterion.score < 14 ? "text-orange-500" : "text-green-600"
                        )}
                      >
                        {criterion.score}/20
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-200">
                    <motion.div
                      className={clsx(
                        "h-2 rounded-full",
                        criterion.score < 9
                          ? "bg-gradient-to-r from-red-400 to-red-500"
                          : criterion.score < 14
                          ? "bg-gradient-to-r from-orange-400 to-orange-500"
                          : "bg-gradient-to-r from-green-400 to-green-500"
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${criterion.progress}%` }}
                      transition={{ duration: 0.8, delay: index * 0.08 }}
                    />
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-slate-500">
                    {criterion.lines.map((line, lineIndex) => (
                      <p
                        key={lineIndex}
                        className={clsx(
                          "leading-relaxed",
                          line.type === "positive"
                            ? "text-green-600"
                            : line.type === "negative"
                            ? "text-red-500"
                            : "text-slate-500"
                        )}
                      >
                        {line.text}
                      </p>
                    ))}
                  </div>
                  <span className={clsx("mt-3 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs", criterion.statusColor)}>
                    {criterion.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-1 flex-col rounded-2xl border border-red-950/40 bg-red-950 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-400/60">Perte mensuelle</p>
              <p className="mt-4 text-4xl font-black text-red-300">
                -{new Intl.NumberFormat("fr-FR").format(animatedMonthlyLoss)}€
              </p>
              <p className="text-sm text-red-400/50">/mois estimés</p>
              <div className="my-4 border-t border-red-900/30" />
              <p className="text-xs text-red-400/40">Sur 12 mois :</p>
              <p className="text-2xl font-black text-red-400/80">-{formattedYearlyLoss}€</p>
            </div>
            <div className="rounded-2xl border border-green-900/30 bg-gradient-to-br from-green-950/50 to-green-900/20 p-5 text-green-400">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-green-400/60">ROI de la correction</p>
              <div className="mt-4 flex items-center justify-between text-sm text-green-400/70">
                <span>Coût Agentable</span>
                <span className="text-lg font-bold text-green-400">{formattedActivation}€ HT</span>
              </div>
              <div className="my-3 border-t border-green-900/30" />
              <div className="flex items-center justify-between text-sm text-green-400/70">
                <span>Économie an 1</span>
                <span className="text-xl font-black text-green-400">+{formattedYearlyGain}€</span>
              </div>
              <div className="mt-3 rounded-xl bg-green-500/10 p-3 text-center text-xs font-semibold text-green-400">
                Rentabilisé dès le 1er mois ✓
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section {...motionBase(0.24)} className="rounded-3xl border border-slate-100 bg-white p-8">
        <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Ce qu'on va corriger pour vous</p>
            <p className="text-sm text-slate-400">Livraison sous 48h après paiement</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600">
            {corrections.length || 0} corrections · {formattedActivation}€ HT
          </span>
        </div>
        {corrections.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune correction spécifique requise sur cet audit.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {corrections.map((correction, index) => {
              const palette = correction.impact === "critique"
                ? { card: "border-red-100 bg-red-50/50", badge: "bg-red-100 text-red-700", number: "bg-red-100 text-red-600", label: "🔴 Critique" }
                : correction.impact === "important"
                ? { card: "border-orange-100 bg-orange-50/50", badge: "bg-orange-100 text-orange-700", number: "bg-orange-100 text-orange-600", label: "🟠 Important" }
                : { card: "border-blue-100 bg-blue-50/50", badge: "bg-blue-100 text-blue-700", number: "bg-blue-100 text-blue-600", label: "🔵 Utile" };
              return (
                <div key={index} className={clsx("flex items-start gap-4 rounded-2xl border p-5", palette.card)}>
                  <div className={clsx("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-black", palette.number)}>
                    {(index + 1).toString().padStart(2, "0")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{correction.probleme}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{correction.solution}</p>
                    <span className={clsx("mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", palette.badge)}>
                      {palette.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.section>

      <motion.section {...motionBase(0.36)} className="relative rounded-3xl border border-white/5 bg-[#0F172A] p-10 text-white overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.25),_transparent_70%)] blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,_rgba(192,132,252,0.2),_transparent_70%)] blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/30">Votre mise en conformité GEO</p>
            <div className="mt-4 flex items-end gap-2">
              <p className="text-8xl font-black leading-none tracking-tighter">{formattedActivation}€</p>
              <span className="text-2xl text-white/20">HT</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">{conversionCopy}</p>
            <div className="mt-6 rounded-2xl border border-white/5 bg-white/5 p-4 text-xs leading-relaxed text-white/40">
              Les agences GEO facturent ce service entre 1 500€ et 3 000€ HT. Agentable le fait en automatique, livré sous 48h.
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/30">Inclus dans votre offre</p>
            <div className="mt-4 space-y-3">
              {includedItems.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-medium text-white/80">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/20">
                    <Check className="h-4 w-4 text-indigo-300" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
            <div className="my-5 border-t border-white/10" />
            <button
              type="button"
              onClick={() => setAddMaintenance((prev) => !prev)}
              className={clsx(
                "flex w-full items-start gap-3 rounded-2xl border p-4 transition",
                addMaintenance ? "border-white/40 bg-white/10" : "border-white/10 bg-white/5 hover:bg-white/10"
              )}
            >
              <input
                type="checkbox"
                checked={addMaintenance}
                onChange={(event) => setAddMaintenance(event.target.checked)}
                className="mt-1.5 h-5 w-5 flex-shrink-0 accent-indigo-400"
              />
              <div>
                <p className="text-sm font-semibold text-white">Maintenance mensuelle</p>
                <p className="text-xs text-white/40">+79€ HT/mois · sans engagement</p>
                <p className="text-xs text-white/30">Suivi GEO mensuel automatisé</p>
              </div>
            </button>
            <div className="mt-4 rounded-xl bg-white/5 p-3">
              <div className="flex items-center justify-between text-sm text-white/40">
                <span>Total :</span>
                <span className="text-3xl font-black text-white">{formattedTotalToday}€ HT</span>
              </div>
              {addMaintenance && <p className="text-xs text-white/40">+ 79€/mois</p>}
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => onCheckout(addMaintenance)}
              className="w-full rounded-2xl bg-indigo-500 px-8 py-5 text-lg font-bold text-white shadow-[0_0_40px_rgba(99,102,241,0.4)] transition hover:bg-indigo-400 hover:shadow-[0_0_60px_rgba(99,102,241,0.6)]"
            >
              Démarrer maintenant →
            </button>
            <p className="mt-2 text-xs text-indigo-200/70">
              Payer {formattedTotalToday}€ et recevoir les corrections sous 48h
            </p>
            <button
              type="button"
              onClick={() => setShowEmailForm((prev) => !prev)}
              className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold text-white/70 transition hover:bg-white/10"
            >
              Recevoir ce rapport par email →
            </button>
            <AnimatePresence initial={false}>
              {showEmailForm && (
                <motion.form
                  key="email-form"
                  onSubmit={handleSendEmail}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 space-y-2 overflow-hidden"
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
                  {emailStatus === "success" && (
                    <p className="text-center text-xs text-white/70">✓ Rapport envoyé !</p>
                  )}
                  {emailStatus === "error" && (
                    <p className="text-center text-xs text-red-300">Erreur lors de l'envoi.</p>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
            <div className="mt-6 space-y-2 text-xs text-white/30">
              {guarantees.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span>🔒</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

function MetricCard({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-white/30">{label}</p>
      <p className={clsx("text-lg font-bold text-white", valueClassName)}>{value}</p>
    </div>
  );
}

function buildCriterionLines(
  key: CriterionKey,
  detail?: CriteriaDetails[CriterionKey]
) {
  if (!detail) return [{ text: "Données insuffisantes", type: "neutral" as const }];

  const lines: Array<{ text: string; type: "positive" | "negative" | "neutral" }> = [];

  switch (key) {
    case "schemaOrg": {
      const schema = detail as CriteriaDetails["schemaOrg"];
      if (schema.found?.length) {
        const displayFound = schema.found.slice(0, 3);
        const extraFound = schema.found.length - displayFound.length;
        const suffixFound = extraFound > 0 ? ` + ${extraFound} autres` : "";
        lines.push({ text: `✓ Trouvé : ${displayFound.join(", ")}${suffixFound}`, type: "positive" });
      } else {
        lines.push({ text: "✗ Aucun type Schema.org détecté", type: "negative" });
      }
      if (schema.missing?.length) {
        const display = schema.missing.slice(0, 3);
        const extra = schema.missing.length - display.length;
        const suffix = extra > 0 ? ` + ${extra} autres` : "";
        lines.push({ text: `✗ Manquant : ${display.join(", ")}${suffix}`, type: "negative" });
      }
      break;
    }
    case "nap": {
      const nap = detail as CriteriaDetails["nap"];
      lines.push({ text: nap.hasPhone ? "✓ Téléphone détecté" : "✗ Téléphone introuvable", type: nap.hasPhone ? "positive" : "negative" });
      lines.push({ text: nap.hasAddress ? "✓ Adresse détectée" : "✗ Adresse introuvable", type: nap.hasAddress ? "positive" : "negative" });
      lines.push({ text: nap.hasEmail ? "✓ Email présent" : "✗ Email absent", type: nap.hasEmail ? "positive" : "negative" });
      if (!nap.isCoherent) {
        lines.push({ text: "✗ Incohérences header/footer", type: "negative" });
      }
      break;
    }
    case "metadata": {
      const meta = detail as CriteriaDetails["metadata"];
      lines.push({ text: meta.hasTitle ? `✓ Title : ${meta.titleLength} caractères` : "✗ Title absent", type: meta.hasTitle ? "positive" : "negative" });
      lines.push({ text: meta.hasDescription ? `✓ Description : ${meta.descLength} caractères` : "✗ Meta description absente", type: meta.hasDescription ? "positive" : "negative" });
      lines.push({ text: meta.hasOG ? "✓ Open Graph complet" : "✗ Open Graph incomplet", type: meta.hasOG ? "positive" : "negative" });
      break;
    }
    case "faq": {
      const faq = detail as CriteriaDetails["faq"];
      lines.push({
        text: faq.hasStructured ? `✓ ${faq.questionsCount} questions structurées détectées` : "✗ Aucune FAQ structurée trouvée",
        type: faq.hasStructured ? "positive" : "negative"
      });
      break;
    }
    case "vitesse": {
      const speed = detail as CriteriaDetails["vitesse"];
      lines.push({ text: `HTML : ${speed.htmlSize}kb · ${speed.scriptsCount} scripts externes`, type: "neutral" });
      if (speed.imagesWithoutAlt > 0) {
        lines.push({ text: `✗ ${speed.imagesWithoutAlt} images sans attribut alt`, type: "negative" });
      }
      lines.push({ text: speed.hasViewportMeta ? "✓ Balise viewport présente" : "✗ Balise viewport absente", type: speed.hasViewportMeta ? "positive" : "negative" });
      break;
    }
    case "citations": {
      const citations = detail as CriteriaDetails["citations"];
      lines.push({
        text: citations.socialLinks?.length ? `✓ Réseaux : ${citations.socialLinks.join(", ")}` : "✗ Aucun réseau social lié",
        type: citations.socialLinks?.length ? "positive" : "negative"
      });
      if (!citations.hasGMB) lines.push({ text: "✗ Google Business Profile non lié", type: "negative" });
      if (!citations.hasReviews) lines.push({ text: "✗ Aucun avis client détecté", type: "negative" });
      break;
    }
  }

  return lines.length ? lines : [{ text: "Données disponibles", type: "neutral" }];
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const from = value;
    const delta = target - from;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + delta * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
