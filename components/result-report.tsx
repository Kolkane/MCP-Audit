"use client";

import { useEffect, useMemo, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import clsx from "clsx";
import { Globe, Check, Mail } from "lucide-react";

import { AnalyzeResponse } from "@/components/hero-analyzer-context";
import { MAINTENANCE_PRICE } from "@/lib/pricing";

const CRITERIA_CONFIG = [
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

const BLOCK_DELAYS = [0, 0.15, 0.3, 0.45];

const SEVERITY = {
  high: {
    color: "text-[#22C55E]",
    stroke: "#22C55E",
    badge: "✓ Site bien structuré",
    badgeClasses: "bg-green-500/15 text-green-200",
    tagline: "Votre site est bien structuré. Quelques optimisations suffisent pour atteindre l'excellence."
  },
  medium: {
    color: "text-[#FB923C]",
    stroke: "#FB923C",
    badge: "⚠ Optimisations requises",
    badgeClasses: "bg-orange-500/15 text-orange-200",
    tagline: "Votre site est partiellement lisible par les agents IA. Des optimisations ciblées feraient une grande différence."
  },
  low: {
    color: "text-[#F87171]",
    stroke: "#F87171",
    badge: "✗ Score critique",
    badgeClasses: "bg-red-500/15 text-red-200",
    tagline: "Votre site est quasi-invisible pour les agents IA. Chaque jour sans optimisation coûte des clients."
  }
} as const;

export function ResultReport({
  result,
  onCheckout,
  checkoutLoading
}: {
  result: AnalyzeResponse;
  onCheckout: (withMaintenance: boolean) => Promise<void>;
  checkoutLoading: "activation" | "maintenance" | null;
}) {
  const [addMaintenance, setAddMaintenance] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const severityKey = result.score > 60 ? "high" : result.score >= 40 ? "medium" : "low";
  const severity = SEVERITY[severityKey];
  const businessLoss = result.valeurPerdue ?? Math.max(0, Math.round((100 - result.score) * 120));
  const maintenancePrice = MAINTENANCE_PRICE;
  const totalToday = addMaintenance ? result.priceActivation + maintenancePrice : result.priceActivation;

  const formattedBusinessLoss = useMemo(() => new Intl.NumberFormat("fr-FR").format(businessLoss), [businessLoss]);
  const formattedBusinessLossAnnuel = useMemo(
    () => new Intl.NumberFormat("fr-FR").format(businessLoss * 12),
    [businessLoss]
  );
  const formattedTotal = useMemo(() => new Intl.NumberFormat("fr-FR").format(result.priceActivation), [result.priceActivation]);
  const formattedTotalToday = useMemo(() => new Intl.NumberFormat("fr-FR").format(totalToday), [totalToday]);

  const criteres = CRITERIA_CONFIG.map((criterion) => ({
    ...criterion,
    score: Math.round(result.criteresDetail?.[criterion.key] ?? 10)
  }));

  const lowestIssues = [...criteres].sort((a, b) => a.score - b.score).slice(0, 3);
  const animatedScore = useCountUp(result.score, 1200);

  const explanation = useMemo(() => {
    if (result.explanation) return result.explanation;
    const defaultIssues = result.issues ?? [];
    if (!defaultIssues.length) {
      return "Votre site présente plusieurs lacunes qui empêchent les IA de le recommander.";
    }
    return defaultIssues.join(" · ");
  }, [result.explanation, result.issues]);

  const handleSendEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !result?.url) return;
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
      if (!response.ok) throw new Error();
      setEmailStatus("success");
    } catch (err) {
      console.error(err);
      setEmailStatus("error");
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-3xl space-y-6">
      {BLOCK_DELAYS.map((delay, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay }}
          className={clsx(
            index === 0 && "relative overflow-hidden rounded-[24px] border border-white/10 bg-[#0F172A] p-10 text-white",
            index === 1 && "rounded-[24px] border border-[#E2E8F0] bg-white p-8",
            index === 2 && "grid gap-6 rounded-[24px] md:grid-cols-2",
            index === 3 && "relative overflow-hidden rounded-[24px] bg-gradient-to-br from-indigo-600 to-indigo-800 p-10 text-white"
          )}
        >
          {index === 0 && (
            <HeaderBlock
              url={result.url}
              cached={result.cached}
              severity={severity}
              score={animatedScore}
            />
          )}
          {index === 1 && <CriteriaBlock criteres={criteres} />}
          {index === 2 && (
            <ImpactBlock
              formattedBusinessLoss={formattedBusinessLoss}
              formattedBusinessLossAnnuel={formattedBusinessLossAnnuel}
              issues={lowestIssues}
            />
          )}
          {index === 3 && (
            <PriceBlock
              explanation={explanation}
              formattedTotal={formattedTotal}
              formattedTotalToday={formattedTotalToday}
              addMaintenance={addMaintenance}
              setAddMaintenance={setAddMaintenance}
              maintenancePrice={maintenancePrice}
              onCheckout={onCheckout}
              checkoutLoading={checkoutLoading}
              showEmailForm={showEmailForm}
              setShowEmailForm={setShowEmailForm}
              email={email}
              setEmail={setEmail}
              emailStatus={emailStatus}
              handleSendEmail={handleSendEmail}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}

function HeaderBlock({
  url,
  cached,
  severity,
  score
}: {
  url?: string;
  cached?: boolean;
  severity: (typeof SEVERITY)[keyof typeof SEVERITY];
  score: number;
}) {
  const circumference = 2 * Math.PI * 64;
  const strokeOffset = circumference - (Math.min(score, 100) / 100) * circumference;

  return (
    <>
      <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-white/60">
          <Globe className="h-4 w-4" />
          <span className="font-mono text-sm">{url ?? "URL analysée"}</span>
          {cached && <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">résultat en cache</span>}
        </div>
      </div>
      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">SCORE AGENT-READINESS</p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <span className={clsx("text-[96px] font-black leading-none", severity.color)}>{score}</span>
            <span className="text-2xl text-white/30">/100</span>
          </div>
          <span className={clsx("mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold", severity.badgeClasses)}>
            {severity.badge}
          </span>
        </div>
        <div className="flex justify-center">
          <div className="relative h-[160px] w-[160px]">
            <svg width="160" height="160">
              <circle cx="80" cy="80" r={72} stroke="rgba(255,255,255,0.1)" strokeWidth="12" fill="none" />
              <motion.circle
                cx="80"
                cy="80"
                r={64}
                stroke={severity.stroke}
                strokeWidth="12"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference}
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
                animate={{ strokeDashoffset: strokeOffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black">{score}</span>
              <span className="text-xs text-white/40">IA Score</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">{severity.tagline}</div>
    </>
  );
}

function CriteriaBlock({ criteres }: { criteres: (typeof CRITERIA_CONFIG)[number] & { score: number }[] }) {
  const average = criteres.reduce((acc, c) => acc + c.score, 0) / criteres.length;
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#64748B]">ANALYSE DÉTAILLÉE</p>
        <div className="text-right text-sm text-[#94A3B8]">
          <span className="font-semibold text-[#0F172A]">{Math.round(average)} / 100</span>
          <span className="ml-2 text-xs">Agent-Readiness Score</span>
        </div>
      </div>
      <div className="mt-6 space-y-5">
        {criteres.map((criterion, index) => {
          const barColor = criterion.score >= 14 ? "bg-gradient-to-r from-green-400 to-green-500" : criterion.score >= 9 ? "bg-gradient-to-r from-orange-400 to-orange-500" : "bg-gradient-to-r from-red-400 to-red-500";
          const textColor = criterion.score >= 14 ? "text-green-500" : criterion.score >= 9 ? "text-orange-500" : "text-red-500";
          const explanation = criterion.score >= 14 ? criterion.explanations.high : criterion.score >= 9 ? criterion.explanations.medium : criterion.explanations.low;
          return (
            <div key={criterion.key}>
              <div className="flex items-center justify-between text-sm font-semibold text-[#0F172A]">
                <span>{criterion.label}</span>
                <span className={clsx("text-xs", textColor)}>{criterion.score}/20</span>
              </div>
              <div className="mt-2 h-3 rounded-full bg-[#F1F5F9]">
                <motion.div
                  className={clsx("h-3 rounded-full", barColor)}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (criterion.score / 20) * 100)}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + index * 0.05, ease: "easeOut" }}
                />
              </div>
              <p className="mt-2 text-xs text-[#94A3B8]">{explanation}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ImpactBlock({
  formattedBusinessLoss,
  formattedBusinessLossAnnuel,
  issues
}: {
  formattedBusinessLoss: string;
  formattedBusinessLossAnnuel: string;
  issues: (typeof CRITERIA_CONFIG)[number] & { score: number }[];
}) {
  return (
    <>
      <div className="rounded-[20px] border border-red-100 bg-[#FEF2F2] p-6 text-red-600">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-red-400">COÛT DE L'INVISIBILITÉ</p>
        <p className="mt-3 text-sm">Chaque mois sans optimisation :</p>
        <p className="mt-2 text-5xl font-black">{formattedBusinessLoss}€</p>
        <p className="text-sm text-red-500/80">/mois estimés perdus</p>
        <div className="mt-4 rounded-xl border border-red-100 bg-white/60 p-3 text-xs text-red-500">
          Basé sur un trafic estimé × taux de conversion IA 2% × valeur client moyenne secteur
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-red-100 pt-4 text-sm">
          <span>Manque à gagner annuel :</span>
          <span className="text-base font-black text-red-600">{formattedBusinessLossAnnuel}€</span>
        </div>
      </div>
      <div className="rounded-[20px] border border-[#E2E8F0] bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#64748B]">PROBLÈMES PRIORITAIRES</p>
        <div className="mt-4 space-y-4">
          {issues.map((issue) => (
            <div key={issue.key} className="border-b border-[#F1F5F9] pb-4 last:border-none last:pb-0">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-50 text-red-500">✗</div>
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{issue.issueTitle}</p>
                  <p className="text-xs text-[#64748B]">{issue.issueDescription}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function PriceBlock({
  explanation,
  formattedTotal,
  formattedTotalToday,
  addMaintenance,
  setAddMaintenance,
  maintenancePrice,
  onCheckout,
  checkoutLoading,
  showEmailForm,
  setShowEmailForm,
  email,
  setEmail,
  emailStatus,
  handleSendEmail
}: {
  explanation: string;
  formattedTotal: string;
  formattedTotalToday: string;
  addMaintenance: boolean;
  setAddMaintenance: (value: boolean) => void;
  maintenancePrice: number;
  onCheckout: (withMaintenance: boolean) => Promise<void>;
  checkoutLoading: "activation" | "maintenance" | null;
  showEmailForm: boolean;
  setShowEmailForm: (value: boolean) => void;
  email: string;
  setEmail: (value: string) => void;
  emailStatus: "idle" | "loading" | "success" | "error";
  handleSendEmail: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <>
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">VOTRE MISE EN CONFORMITÉ</p>
          <p className="text-7xl font-black">{formattedTotal}€ HT</p>
          <p className="text-sm text-white/70 max-w-sm leading-relaxed">{explanation}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/10 p-5 text-sm text-white/70">
          <p className="mb-3 text-white/80">Ce qui est inclus :</p>
          <ul className="space-y-2">
            {[
              "Endpoint MCP actif",
              "Schema.org complet",
              "Fichier llms.txt optimisé",
              "Score garanti >80/100"
            ].map((item) => (
              <li key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> {item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end">
        <div className="flex-1 rounded-2xl border border-white/20 bg-white/10 p-5">
          <label className="flex cursor-pointer items-start gap-3" htmlFor="maintenance-toggle">
            <input
              id="maintenance-toggle"
              type="checkbox"
              checked={addMaintenance}
              onChange={(event) => setAddMaintenance(event.target.checked)}
              className="mt-1 h-5 w-5 accent-white"
            />
            <div>
              <p className="text-sm font-semibold text-white">Maintenance mensuelle</p>
              <p className="text-xs text-white/70">+ {maintenancePrice}€ HT/mois · sans engagement</p>
              <p className="text-xs text-white/50">Monitoring mensuel + mises à jour automatiques si score baisse</p>
            </div>
          </label>
          <div className="mt-4 border-t border-white/10 pt-4 text-sm text-white/60">
            Total aujourd'hui : <span className="text-2xl font-black text-white">{formattedTotalToday}€ HT</span>
            {addMaintenance && <span className="text-white/50"> + {maintenancePrice}€/mois</span>}
          </div>
        </div>
        <div className="flex w-full flex-col gap-3 lg:max-w-xs">
          <button
            type="button"
            onClick={() => onCheckout(addMaintenance)}
            className="rounded-[14px] bg-white px-8 py-5 text-lg font-bold text-indigo-700 shadow-[0_8px_32px_rgba(15,23,42,0.35)] transition hover:bg-indigo-50"
          >
            {checkoutLoading === (addMaintenance ? "maintenance" : "activation") ? "Chargement..." : `Payer ${formattedTotalToday}€ et démarrer →`}
          </button>
          <button
            type="button"
            onClick={() => setShowEmailForm((prev) => !prev)}
            className="rounded-[14px] border border-white/20 bg-white/10 px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Recevoir ce rapport par email →
          </button>
          {showEmailForm && (
            <form onSubmit={handleSendEmail} className="rounded-[12px] border border-white/20 bg-white/10 p-4 text-sm">
              <div className="flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="votre@email.fr"
                  className="w-full rounded-xl border border-white/30 bg-transparent px-4 py-3 text-white placeholder-white/40 focus:border-white"
                  required
                />
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/20 px-4 py-3 font-semibold text-white transition hover:bg-white/30"
                >
                  {emailStatus === "loading" ? "Envoi..." : (<><Mail className="h-4 w-4" /> Envoyer →</>)}
                </button>
                {emailStatus === "success" && <p className="text-center text-xs text-white">✓ Rapport envoyé !</p>}
                {emailStatus === "error" && <p className="text-center text-xs text-red-200">Erreur lors de l'envoi. Réessaie.</p>}
              </div>
            </form>
          )}
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-white/40">🔒 Paiement sécurisé · Stripe · Facture HT disponible</p>
    </>
  );
}

function useCountUp(value: number, durationMs: number) {
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: durationMs / 1000 });
    const unsubscribe = motionValue.on("change", (latest) => setDisplay(Math.round(latest)));
    return () => {
      unsubscribe();
      controls.stop();
    };
  }, [motionValue, value, durationMs]);

  return display;
}
