"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, AlertCircle, Mail } from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";

import { MAINTENANCE_PRICE } from "@/lib/pricing";
import { useHeroAnalyzer, AnalyzeResponse } from "@/components/hero-analyzer-context";

const LOADING_MESSAGES = [
  "Lecture des métadonnées...",
  "Vérification schema.org...",
  "Analyse des données NAP...",
  "Détection FAQ structurée...",
  "Calcul du score final..."
];

const criteriaOrder = [
  { key: "schemaOrg", label: "Schema.org" },
  { key: "nap", label: "Données NAP" },
  { key: "metadata", label: "Métadonnées" },
  { key: "faq", label: "FAQ structurée" },
  { key: "vitesse", label: "Vitesse page" },
  { key: "citations", label: "Citations externes" }
] as const;

const levelBadges = {
  simple: { label: "✓ Site structuré", classes: "bg-green-50 text-green-700" },
  moyen: { label: "⚠ Optimisations requises", classes: "bg-orange-50 text-orange-700" },
  complexe: { label: "⚠ Score critique", classes: "bg-red-50 text-red-700" }
};

type CheckoutState = "activation" | "maintenance" | null;

export function HeroAnalyzer() {
  const { url, setUrl, analysisState, result, error, analyze, setError, reset } = useHeroAnalyzer();
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState<CheckoutState>(null);

  useEffect(() => {
    if (analysisState === "loading") {
      setLoadingMessageIndex(0);
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [analysisState]);

  useEffect(() => {
    if (analysisState === "loading") {
      setProgress(0);
      const timeout = setTimeout(() => setProgress(100), 50);
      return () => {
        clearTimeout(timeout);
        setProgress(0);
      };
    } else {
      setProgress(0);
    }
  }, [analysisState]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await analyze();
  };

  const handleCheckout = async (withMaintenance: boolean) => {
    if (!result?.auditId) return;
    setCheckoutLoading(withMaintenance ? "maintenance" : "activation");
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId: result.auditId, addMaintenance: withMaintenance })
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Redirection impossible");
      }
    } catch (err) {
      console.error(err);
      setError("Impossible de lancer le paiement pour le moment.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleReset = () => {
    reset();
    document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="mx-auto mt-8 flex w-full max-w-xl flex-col gap-3 sm:flex-row">
        <input
          type="url"
          required
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://votre-site.fr"
          className="flex-1 rounded-2xl border-2 border-[#E2E8F0] bg-white px-5 py-4 text-base text-night focus:border-indigo-400 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-2xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white transition hover:bg-indigo-700"
        >
          {analysisState === "loading" ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Analyser gratuitement →"}
        </button>
      </form>
      <p className="mt-3 text-center text-sm text-[#94A3B8]">⚡ Résultat en 60 secondes · 100% gratuit · Sans inscription</p>
      {analysisState === "done" && (
        <button
          type="button"
          onClick={handleReset}
          className="mt-2 text-sm font-semibold text-indigo-400 transition hover:text-indigo-600"
        >
          ← Analyser un autre site
        </button>
      )}
      {error && (
        <div className="mx-auto mt-4 flex max-w-xl items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {analysisState === "loading" && (
        <LoadingPanel url={url} message={LOADING_MESSAGES[loadingMessageIndex]} progress={progress} />
      )}

      {analysisState === "done" && result && (
        <ResultPanel result={result} checkoutLoading={checkoutLoading} onCheckout={handleCheckout} />
      )}
    </div>
  );
}

function LoadingPanel({ url, message, progress }: { url: string; message: string; progress: number }) {
  return (
    <div className="mx-auto mt-8 max-w-lg rounded-3xl border border-[#E2E8F0] bg-white p-10">
      <p className="text-center text-sm font-mono text-[#64748B]">Analyse de {url || "votre URL"}...</p>
      <div className="mt-6 flex justify-center">
        <div className="h-16 w-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
      </div>
      <p className="mt-6 text-center text-base text-[#64748B]">{message}</p>
      <div className="mt-6 h-2 rounded-full bg-[#F1F5F9] text-left">
        <div
          className="h-full rounded-full bg-indigo-600 transition-[width] duration-[15000ms] ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-4 text-center text-xs text-[#94A3B8]">⚡ Résultat dans quelques secondes</p>
    </div>
  );
}

type ResultPanelProps = {
  result: AnalyzeResponse;
  checkoutLoading: CheckoutState;
  onCheckout: (withMaintenance: boolean) => Promise<void>;
};

function ResultPanel({ result, checkoutLoading, onCheckout }: ResultPanelProps) {
  const [addMaintenance, setAddMaintenance] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    setAddMaintenance(false);
    setShowEmailForm(false);
    setEmail("");
    setEmailStatus("idle");
  }, [result?.auditId]);

  const badge = levelBadges[(result?.niveau as keyof typeof levelBadges) || "moyen"] || levelBadges.moyen;
  const donutColor = result.score > 60 ? "#22C55E" : result.score >= 40 ? "#F97316" : "#EF4444";
  const businessLoss = result.valeurPerdue ?? Math.max(0, Math.round((100 - result.score) * 120));
  const maintenancePrice = result.maintenancePrice ?? MAINTENANCE_PRICE;
  const totalToday = addMaintenance ? result.priceActivation + maintenancePrice : result.priceActivation;
  const criteriaScores = criteriaOrder.map(({ key, label }) => ({
    label,
    score: Math.round(result.criteresDetail?.[key] ?? 10)
  }));

  const formattedBusinessLoss = useMemo(
    () => new Intl.NumberFormat("fr-FR").format(businessLoss),
    [businessLoss]
  );

  const formattedTotal = useMemo(
    () => new Intl.NumberFormat("fr-FR").format(result.priceActivation),
    [result.priceActivation]
  );

  const formattedTotalToday = useMemo(
    () => new Intl.NumberFormat("fr-FR").format(totalToday),
    [totalToday]
  );

  const progressCircle = (() => {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(result.score, 100) / 100) * circumference;
    return { radius, circumference, offset };
  })();

  const barColor = (score: number) => {
    if (score >= 14) return "bg-green-500";
    if (score >= 9) return "bg-orange-400";
    return "bg-red-500";
  };

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto mt-8 max-w-4xl"
    >
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="lg:w-[45%]">
          <div className="h-full rounded-3xl border border-[#E2E8F0] bg-white p-8">
            <span className="inline-block rounded-xl bg-[#F8F9FF] px-3 py-1.5 font-mono text-xs text-[#64748B]">
              {result.url ?? "URL analysée"}
            </span>
            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="relative h-[140px] w-[140px]">
                <svg width="140" height="140">
                  <circle cx="70" cy="70" r={progressCircle.radius} stroke="#F1F5F9" strokeWidth="10" fill="none" />
                  <motion.circle
                    cx="70"
                    cy="70"
                    r={progressCircle.radius}
                    stroke={donutColor}
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={progressCircle.circumference}
                    strokeDashoffset={progressCircle.circumference}
                    strokeLinecap="round"
                    transform="rotate(-90 70 70)"
                    animate={{ strokeDashoffset: progressCircle.offset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-night">{result.score}</span>
                  <span className="text-sm text-[#94A3B8]">/100</span>
                </div>
              </div>
              <span className={clsx("rounded-full px-3 py-1 text-sm font-semibold", badge.classes)}>{badge.label}</span>
            </div>
            <div className="my-6 h-px w-full bg-[#F1F5F9]" />
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-center text-red-600">
              <p className="text-sm font-semibold">💸 Valeur business perdue estimée</p>
              <p className="text-2xl font-black">{formattedBusinessLoss}€/mois</p>
            </div>
            <div className="mt-4">
              <p className="text-sm font-semibold text-night">Problèmes détectés :</p>
              <ul className="mt-2 space-y-2 text-sm text-[#64748B]">
                {(result.issues ?? []).slice(0, 3).map((issue) => (
                  <li key={issue} className="flex items-start gap-2">
                    <span className="text-red-500">✕</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="lg:w-[55%]">
          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#94A3B8]">Détail par critère</p>
            <div className="mt-4 space-y-4">
              {criteriaScores.map((criterion, index) => (
                <div key={criterion.label}>
                  <div className="flex items-center justify-between text-sm font-medium text-night">
                    <span>{criterion.label}</span>
                    <span className="text-xs text-[#94A3B8]">{criterion.score}/20</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-[#F1F5F9]">
                    <motion.div
                      className={clsx("h-full rounded-full", barColor(criterion.score))}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (criterion.score / 20) * 100)}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + index * 0.05 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-indigo-600 p-8 text-white">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="lg:w-2/3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Votre mise en conformité</p>
            <p className="mt-2 text-5xl font-black">{formattedTotal}€ HT</p>
            <p className="mt-2 text-sm text-white/70">{result.explanation || "Corrections personnalisées selon vos lacunes."}</p>
            <div className="mt-4 rounded-2xl bg-white/10 p-4">
              <label className="flex items-center justify-between text-sm font-semibold" htmlFor="maintenance-toggle">
                <span className="flex items-center gap-2">
                  <input
                    id="maintenance-toggle"
                    type="checkbox"
                    checked={addMaintenance}
                    onChange={(event) => setAddMaintenance(event.target.checked)}
                    className="h-4 w-4 accent-white"
                  />
                  Ajouter la maintenance
                </span>
                <span className="text-white/70">+{maintenancePrice}€ HT/mois</span>
              </label>
            </div>
            <p className="mt-3 text-sm text-white/70">
              Total aujourd'hui : <span className="font-semibold text-white">{formattedTotalToday}€ HT</span>
              {addMaintenance && <span className="text-white/60"> + {maintenancePrice}€/mois</span>}
            </p>
          </div>
          <div className="lg:w-1/3">
            <button
              type="button"
              onClick={() => onCheckout(addMaintenance)}
              className="w-full rounded-2xl bg-white px-6 py-4 text-lg font-bold text-indigo-600 transition hover:bg-indigo-50"
            >
              {checkoutLoading === (addMaintenance ? "maintenance" : "activation") ? (
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              ) : (
                `Payer ${formattedTotalToday}€ et démarrer →`
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowEmailForm((prev) => !prev)}
              className="mt-3 w-full rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Recevoir ce rapport par email →
            </button>
            {showEmailForm && (
              <form onSubmit={handleSendEmail} className="mt-3 space-y-3 text-sm">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="prenom@entreprise.fr"
                  className="w-full rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-white placeholder-white/50 focus:border-white"
                  required
                />
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2 font-semibold text-white border border-white/30"
                >
                  {emailStatus === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Envoyer →
                </button>
                {emailStatus === "success" && <p className="text-center text-xs text-white">✓ Rapport envoyé !</p>}
                {emailStatus === "error" && <p className="text-center text-xs text-red-200">Erreur lors de l'envoi.</p>}
              </form>
            )}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-white/60">Paiement sécurisé Stripe</p>
      </div>
    </motion.div>
  );
}
