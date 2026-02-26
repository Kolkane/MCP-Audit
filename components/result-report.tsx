"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Check, Globe, Mail } from "lucide-react";

import { AnalyzeResponse } from "@/components/hero-analyzer-context";
import { MAINTENANCE_PRICE } from "@/lib/pricing";

const CRITERIA_DISPLAY = [
  {
    key: "schemaOrg",
    label: "Schema.org",
    explanations: {
      low: "Données structurées absentes. Les IA ne savent pas ce que fait votre entreprise.",
      medium: "Schema.org partiel. Certaines informations manquent aux agents IA.",
      high: "Données structurées complètes. Les IA comprennent votre activité."
    },
    issueTitle: "Schema.org manquant",
    issueDescription: "Les agents IA ignorent votre activité et vos services."
  },
  {
    key: "nap",
    label: "Données NAP",
    explanations: {
      low: "Nom, adresse et téléphone introuvables ou incohérents.",
      medium: "Coordonnées partiellement présentes. Cohérence à améliorer.",
      high: "Coordonnées cohérentes et bien référencées."
    },
    issueTitle: "Coordonnées introuvables",
    issueDescription: "Impossible pour une IA de recommander votre adresse."
  },
  {
    key: "metadata",
    label: "Métadonnées",
    explanations: {
      low: "Title, description et Open Graph incomplets ou absents.",
      medium: "Métadonnées partielles. Open Graph à compléter.",
      high: "Métadonnées complètes et optimisées pour les IA."
    },
    issueTitle: "Métadonnées incomplètes",
    issueDescription: "ChatGPT ne peut pas résumer votre offre correctement."
  },
  {
    key: "faq",
    label: "FAQ structurée",
    explanations: {
      low: "Aucune FAQ structurée. Les agents IA ne trouvent pas de réponses à donner.",
      medium: "FAQ présente mais non balisée en schema.org.",
      high: "FAQ structurée et balisée. Excellente source pour les IA."
    },
    issueTitle: "Pas de FAQ structurée",
    issueDescription: "Aucune réponse disponible pour les requêtes fréquentes."
  },
  {
    key: "vitesse",
    label: "Vitesse page",
    explanations: {
      low: "Site lent. Les agents IA abandonnent l'exploration.",
      medium: "Vitesse correcte mais optimisable.",
      high: "Site rapide. Exploration fluide par les IA."
    },
    issueTitle: "Site trop lent",
    issueDescription: "Les crawlers IA abandonnent avant d'indexer votre contenu."
  },
  {
    key: "citations",
    label: "Citations externes",
    explanations: {
      low: "Aucune mention externe détectée. Crédibilité faible pour les IA.",
      medium: "Quelques mentions externes. Autorité à renforcer.",
      high: "Bien référencé externalement. Bonne crédibilité IA."
    },
    issueTitle: "Autorité web insuffisante",
    issueDescription: "Votre site manque de références externes crédibles."
  }
] as const;

const SEVERITY = {
  high: {
    badgeText: "✓ Site structuré",
    badgeClasses: "bg-green-500/15 text-green-200",
    scoreColor: "text-[#22C55E]",
    stroke: "#22C55E",
    tagline: "Votre site est lisible par les agents IA. Quelques optimisations suffisent."
  },
  medium: {
    badgeText: "⚠ Optimisations requises",
    badgeClasses: "bg-orange-500/15 text-orange-200",
    scoreColor: "text-[#FB923C]",
    stroke: "#FB923C",
    tagline: "Les IA comprennent partiellement votre site. Priorisez les correctifs listés."
  },
  low: {
    badgeText: "✗ Score critique",
    badgeClasses: "bg-red-500/15 text-red-200",
    scoreColor: "text-[#F87171]",
    stroke: "#F87171",
    tagline: "Votre site est quasi invisible pour les agents IA. Chaque jour coûte des clients."
  }
} as const;

const BLOCK_DELAYS = [0, 0.15, 0.3, 0.45];

type ResultReportProps = {
  result: AnalyzeResponse;
  checkoutLoading: "activation" | "maintenance" | null;
  onCheckout: (withMaintenance: boolean) => Promise<void>;
};

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

  const severityKey = result.score > 60 ? "high" : result.score >= 40 ? "medium" : "low";
  const severity = SEVERITY[severityKey];

  const criteres = CRITERIA_DISPLAY.map((criterion) => ({
    ...criterion,
    score: Math.round(result.criteresDetail?.[criterion.key] ?? 10)
  }));

  const lowestIssues = [...criteres].sort((a, b) => a.score - b.score).slice(0, 3);

  const businessLoss = result.valeurPerdue ?? Math.max(0, Math.round((100 - result.score) * 120));
  const formattedBusinessLoss = useMemo(() => new Intl.NumberFormat("fr-FR").format(businessLoss), [businessLoss]);
  const formattedBusinessLossYear = useMemo(
    () => new Intl.NumberFormat("fr-FR").format(businessLoss * 12),
    [businessLoss]
  );

  const maintenancePrice = result.maintenancePrice ?? MAINTENANCE_PRICE;
  const totalToday = addMaintenance ? result.priceActivation + maintenancePrice : result.priceActivation;
  const formattedTotalToday = useMemo(() => new Intl.NumberFormat("fr-FR").format(totalToday), [totalToday]);
  const includedItems = [
    "Schema.org généré",
    "Fichier llms.txt créé",
    "Métadonnées optimisées",
    "Score GEO amélioré sous 48h"
  ];
  const formattedActivation = useMemo(
    () => new Intl.NumberFormat("fr-FR").format(result.priceActivation),
    [result.priceActivation]
  );

  const animatedScore = useCountUp(result.score, 1200);

  const explanation = useMemo(() => {
    if (result.explanation) return result.explanation;
    const fallbacks = result.issues ?? [];
    if (!fallbacks.length) {
      return "Votre site présente plusieurs lacunes qui empêchent les IA de le recommander.";
    }
    return fallbacks.join(" · ");
  }, [result.explanation, result.issues]);

  const circle = useMemo(() => {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const ratio = Math.min(100, Math.max(0, result.score)) / 100;
    return {
      radius,
      circumference,
      offset: circumference - ratio * circumference
    };
  }, [result.score]);

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
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto mt-10 flex w-full max-w-5xl flex-col gap-8"
    >
      {/* Bloc 1 */}
      <motion.div
        className="rounded-3xl bg-[#0F172A] p-8 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: BLOCK_DELAYS[0], duration: 0.4 }}
      >
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm text-white/70">
              <Globe className="h-4 w-4" />
              {result.url ?? "URL analysée"}
            </span>
            <div className="flex flex-wrap items-end gap-3">
              <span className={clsx("text-6xl font-black sm:text-7xl", severity.scoreColor)}>
                {animatedScore}
              </span>
              <span className="text-3xl text-white/30">/100</span>
            </div>
            <span className={clsx("inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold", severity.badgeClasses)}>
              {severity.badgeText}
            </span>
            <p className="text-base text-white/70">{severity.tagline}</p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-44 w-44">
              <svg width="176" height="176">
                <circle cx="88" cy="88" r={circle.radius} stroke="rgba(255,255,255,0.15)" strokeWidth="12" fill="none" />
                <motion.circle
                  cx="88"
                  cy="88"
                  r={circle.radius}
                  stroke={severity.stroke}
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circle.circumference}
                  strokeDashoffset={circle.circumference}
                  transform="rotate(-90 88 88)"
                  animate={{ strokeDashoffset: circle.offset }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-5xl font-black">{result.score}</span>
                <p className="text-sm text-white/60">Score IA</p>
              </div>
            </div>
            <p className="max-w-sm text-center text-sm text-white/60">{explanation}</p>
          </div>
        </div>
      </motion.div>

      {/* Bloc 2 */}
      <motion.div
        className="rounded-3xl border border-[#E2E8F0] bg-white p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: BLOCK_DELAYS[1], duration: 0.4 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#94A3B8]">6 critères audités</p>
            <p className="text-base font-semibold text-night">Lecture complète du site</p>
          </div>
          <span className="text-sm text-[#94A3B8]">Score /20</span>
        </div>
        <div className="mt-6 space-y-4">
          {criteres.map((criterion, index) => {
            const percentage = Math.min(100, (criterion.score / 20) * 100);
            const color = criterion.score >= 14 ? "bg-green-400" : criterion.score >= 9 ? "bg-orange-400" : "bg-red-400";
            return (
              <div key={criterion.key}>
                <div className="flex items-center justify-between text-sm font-medium text-night">
                  <span>{criterion.label}</span>
                  <span className="text-xs text-[#94A3B8]">{criterion.score}/20</span>
                </div>
                <div className="mt-1 h-3 w-full rounded-full bg-[#F1F5F9]">
                  <motion.div
                    className={clsx("h-full rounded-full", color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.7, delay: 0.2 + index * 0.05 }}
                  />
                </div>
                <p className="mt-1 text-xs text-[#94A3B8]">
                  {criterion.score >= 14
                    ? criterion.explanations.high
                    : criterion.score >= 9
                    ? criterion.explanations.medium
                    : criterion.explanations.low}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Bloc 3 */}
      <motion.div
        className="grid grid-cols-2 gap-6 max-md:grid-cols-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: BLOCK_DELAYS[2], duration: 0.4 }}
      >
        <div className="rounded-3xl bg-gradient-to-b from-red-500 to-red-600 p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Impact immédiat</p>
          <p className="mt-3 text-4xl font-black">-{formattedBusinessLoss}€</p>
          <p className="text-sm text-white/70">par mois de valeur perdue</p>
          <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm">
            <p className="font-semibold text-white">{formattedBusinessLossYear}€ / an</p>
            <p className="text-white/70">si aucune action n'est menée</p>
          </div>
          <p className="mt-4 text-sm text-white/70">Chaque point de score manquant empêche les IA de recommander votre offre.</p>
        </div>
        <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-night">3 lacunes prioritaires</p>
            <span className="text-xs text-[#94A3B8]">Auto-détectées</span>
          </div>
          <div className="mt-4 space-y-4">
            {lowestIssues.map((issue) => (
              <div key={issue.key} className="rounded-2xl bg-[#F8FAFC] p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-1 text-red-500">✕</span>
                  <div>
                    <p className="text-sm font-semibold text-night">{issue.issueTitle}</p>
                    <p className="text-sm text-[#64748B]">{issue.issueDescription}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Bloc 4 */}
      <motion.div
        className="rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: BLOCK_DELAYS[3], duration: 0.4 }}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Mise en conformité IA</p>
              <p className="text-5xl font-black">{formattedActivation}€ HT</p>
            </div>
            <p className="max-w-xl text-sm text-white/70">{explanation}</p>
            <div className="space-y-2 text-sm text-white/80">
              <p className="font-semibold text-white">Ce qui est inclus :</p>
              <ul className="space-y-1">
                {includedItems.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-white" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <label className="mt-4 flex items-center gap-3 text-sm font-semibold" htmlFor="maintenance-checkbox">
              <input
                id="maintenance-checkbox"
                type="checkbox"
                checked={addMaintenance}
                onChange={(event) => setAddMaintenance(event.target.checked)}
                className="h-5 w-5 rounded border-white/40 bg-transparent text-indigo-600 accent-white"
              />
              Maintenance IA +{maintenancePrice}€ HT/mois (optionnel)
            </label>
            <p className="text-sm text-white/70">
              Total aujourd'hui : <span className="text-2xl font-bold text-white">{formattedTotalToday}€ HT</span>
              {addMaintenance && <span className="text-white/60"> + {maintenancePrice}€/mois</span>}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 lg:max-w-sm">
            <button
              type="button"
              onClick={() => onCheckout(addMaintenance)}
              className="rounded-2xl bg-white px-6 py-4 text-lg font-bold text-indigo-700 shadow-lg transition hover:bg-indigo-50"
            >
              {checkoutLoading === (addMaintenance ? "maintenance" : "activation") ? (
                <span className="text-indigo-500">Traitement...</span>
              ) : (
                <>Payer {formattedTotalToday}€ et démarrer →</>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowEmailForm((prev) => !prev)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Mail className="h-4 w-4" /> Recevoir ce rapport par email
            </button>
            {showEmailForm && (
              <form onSubmit={handleSendEmail} className="rounded-2xl border border-white/20 bg-white/10 p-4 text-sm">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="prenom@entreprise.fr"
                  className="w-full rounded-xl border border-white/40 bg-transparent px-3 py-2 text-white placeholder-white/50 focus:border-white"
                />
                <button
                  type="submit"
                  className="mt-3 w-full rounded-xl bg-white/20 py-2 font-semibold text-white transition hover:bg-white/30"
                >
                  {emailStatus === "loading" ? "Envoi..." : "Envoyer →"}
                </button>
                {emailStatus === "success" && <p className="mt-2 text-center text-xs text-white">✓ Rapport envoyé</p>}
                {emailStatus === "error" && <p className="mt-2 text-center text-xs text-red-200">Erreur lors de l'envoi.</p>}
              </form>
            )}
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-white/60">🔒 Paiement sécurisé via Stripe</p>
      </motion.div>
    </motion.div>
  );
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
