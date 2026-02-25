"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, AlertCircle, Mail, Check, Circle } from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";

import { MAINTENANCE_PRICE } from "@/lib/pricing";
import { useHeroAnalyzer, AnalyzeResponse } from "@/components/hero-analyzer-context";

const HERO_BADGES = [
  { label: "🟢 23/100 score moyen PME FR" },
  { label: "⚡ Résultat en 60 secondes" },
  { label: "🔒 100% gratuit" }
];

const LOADING_STEPS = [
  {
    title: "Lecture du site",
    subtitle: "Accès aux données publiques"
  },
  {
    title: "Analyse schema.org",
    subtitle: "Vérification données structurées"
  },
  {
    title: "Vérification métadonnées",
    subtitle: "Title, description, Open Graph"
  },
  {
    title: "Calcul du score final",
    subtitle: "Génération du rapport"
  }
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
  simple: { label: "✓ Site structuré", classes: "bg-green-500/20 text-green-200" },
  moyen: { label: "⚠ Optimisations requises", classes: "bg-orange-500/20 text-orange-200" },
  complexe: { label: "⚠ Score critique", classes: "bg-red-500/20 text-red-200" }
};

type CheckoutState = "activation" | "maintenance" | null;

export function HeroAnalyzer() {
  const { url, setUrl, analysisState, result, error, analyze, setError, reset } = useHeroAnalyzer();
  const [progress, setProgress] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState<CheckoutState>(null);

  useEffect(() => {
    if (analysisState === "loading") {
      setProgress(0);
      const startTime = performance.now();
      let frameId: number;

      const updateProgress = (now: number) => {
        const elapsed = now - startTime;
        const next = Math.min(100, (elapsed / 15000) * 100);
        setProgress(next);
        if (next < 100) {
          frameId = requestAnimationFrame(updateProgress);
        }
      };

      frameId = requestAnimationFrame(updateProgress);
      return () => cancelAnimationFrame(frameId);
    }

    setProgress(0);
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
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-[#94A3B8]">
        {HERO_BADGES.map((badge) => (
          <span key={badge.label} className="rounded-full bg-white/60 px-3 py-1 font-semibold">{badge.label}</span>
        ))}
      </div>
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

function LoadingPanel({ url, progress }: { url: string; progress: number }) {
  const stepSize = 100 / LOADING_STEPS.length;

  return (
    <div className="mx-auto mt-8 max-w-2xl rounded-[24px] bg-[#0F172A] p-10 text-center text-white">
      <span className="inline-block rounded-lg bg-white/5 px-4 py-2 font-mono text-sm text-white/60">
        Analyse de {url || "votre URL"}...
      </span>

      <div className="mt-8 flex flex-col gap-4 text-left">
        {LOADING_STEPS.map((step, index) => {
          const start = index * stepSize;
          const end = (index + 1) * stepSize;
          const status = progress >= end ? "done" : progress >= start ? "active" : "upcoming";

          return (
            <div key={step.title} className="flex items-center gap-4">
              <div
                className={clsx(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  status === "done" && "bg-green-500/20",
                  status === "active" && "bg-indigo-500/20 border border-white/20",
                  status === "upcoming" && "bg-white/5"
                )}
              >
                {status === "done" && <Check className="h-5 w-5 text-green-300" />}
                {status === "active" && <Loader2 className="h-5 w-5 animate-spin text-indigo-200" />}
                {status === "upcoming" && <Circle className="h-5 w-5 text-white/30" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{step.title}</p>
                <p className="text-xs text-white/40">{step.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 h-1.5 w-full rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-indigo-400 transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-4 text-xs text-white/40">⚡ Résultat dans quelques secondes</p>
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

  const severity = result.score > 60
    ? { scoreClass: "text-[#22C55E]", donut: "#22C55E" }
    : result.score >= 40
    ? { scoreClass: "text-[#F97316]", donut: "#F97316" }
    : { scoreClass: "text-[#EF4444]", donut: "#EF4444" };

  const badge = levelBadges[(result?.niveau as keyof typeof levelBadges) || "moyen"] || levelBadges.moyen;
  const businessLoss = result.valeurPerdue ?? Math.max(0, Math.round((100 - result.score) * 120));
  const maintenancePrice = result.maintenancePrice ?? MAINTENANCE_PRICE;
  const totalToday = addMaintenance ? result.priceActivation + maintenancePrice : result.priceActivation;
  const criteriaScores = criteriaOrder.map(({ key, label }) => ({ label, score: Math.round(result.criteresDetail?.[key] ?? 10) }));

  const formattedBusinessLoss = useMemo(() => new Intl.NumberFormat("fr-FR").format(businessLoss), [businessLoss]);
  const formattedTotal = useMemo(() => new Intl.NumberFormat("fr-FR").format(result.priceActivation), [result.priceActivation]);
  const formattedTotalToday = useMemo(() => new Intl.NumberFormat("fr-FR").format(totalToday), [totalToday]);

  const progressCircle = (() => {
    const radius = 64;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(result.score, 100) / 100) * circumference;
    return { radius, circumference, offset };
  })();

  const barColor = (score: number) => {
    if (score >= 14) return "bg-green-400";
    if (score >= 9) return "bg-orange-400";
    return "bg-red-400";
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
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto mt-10 max-w-5xl space-y-6"
    >
      <div className="rounded-[24px] bg-[#0F172A] p-8 text-white flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <span className="inline-flex items-center rounded-xl bg-white/10 px-4 py-1.5 font-mono text-xs text-white/70">
            {result.url ?? "URL analysée"}
          </span>
          <div className="flex flex-wrap items-end gap-3">
            <span className={clsx("text-6xl font-black sm:text-8xl", severity.scoreClass)}>{result.score}</span>
            <span className="text-2xl text-white/30">/100</span>
          </div>
          <span className={clsx("inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold", badge.classes)}>
            {badge.label}
          </span>
        </div>
        <div className="flex justify-center">
          <div className="relative h-[160px] w-[160px]">
            <svg width="160" height="160">
              <circle cx="80" cy="80" r={progressCircle.radius + 8} stroke="rgba(255,255,255,0.1)" strokeWidth="12" fill="none" />
              <motion.circle
                cx="80"
                cy="80"
                r={progressCircle.radius}
                stroke={severity.donut}
                strokeWidth="12"
                fill="none"
                strokeDasharray={progressCircle.circumference}
                strokeDashoffset={progressCircle.circumference}
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
                animate={{ strokeDashoffset: progressCircle.offset }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black">{result.score}</span>
              <span className="text-sm text-white/60">Score IA</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[20px] border border-[#E2E8F0] bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#64748B]">Détail par critère</p>
          <div className="mt-4 space-y-4">
            {criteriaScores.map((criterion, index) => (
              <div key={criterion.label}>
                <div className="flex items-center justify-between text-sm font-medium text-night">
                  <span>{criterion.label}</span>
                  <span className="text-xs text-[#94A3B8]">{criterion.score}/20</span>
                </div>
                <div className="mt-1 h-3 rounded-full bg-[#F1F5F9]">
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
        <div className="rounded-[20px] border border-[#E2E8F0] bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#64748B]">Impact business estimé</p>
          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-[#EF4444]">
            <p className="text-sm font-semibold">💸 Chaque mois sans optimisation</p>
            <p className="mt-2 text-5xl font-black">{formattedBusinessLoss}€</p>
            <p className="text-sm text-red-500/70">/mois de valeur perdue</p>
          </div>
          <div className="mt-6">
            <p className="text-sm font-bold text-night">Problèmes prioritaires</p>
            <ul className="mt-3 space-y-3 text-sm text-[#64748B]">
              {(result.issues ?? []).slice(0, 3).map((issue) => (
                <li key={issue} className="flex items-start gap-3">
                  <span className="mt-0.5 text-red-500">✕</span>
                  <span className="leading-relaxed">{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Votre mise en conformité</p>
        <p className="mt-2 text-6xl font-black">{formattedTotal}€ HT</p>
        <p className="mt-2 text-sm text-white/70 max-w-2xl">{result.explanation || "Corrections personnalisées selon vos lacunes."}</p>
        <div className="my-6 h-px w-full bg-white/10" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end">
          <div className="flex-1">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <label className="flex items-center gap-3 text-sm font-semibold" htmlFor="maintenance-toggle">
                <input
                  id="maintenance-toggle"
                  type="checkbox"
                  checked={addMaintenance}
                  onChange={(event) => setAddMaintenance(event.target.checked)}
                  className="h-5 w-5 accent-white"
                />
                <div>
                  <p>Maintenance mensuelle</p>
                  <p className="text-xs text-white/60">+79€ HT/mois · sans engagement</p>
                </div>
              </label>
            </div>
            <p className="mt-4 text-sm text-white/60">
              Total aujourd'hui : <span className="text-2xl font-black text-white">{formattedTotalToday}€ HT</span>
              {addMaintenance && <span className="text-white/50"> + {maintenancePrice}€/mois</span>}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 lg:max-w-xs">
            <button
              type="button"
              onClick={() => onCheckout(addMaintenance)}
              className="rounded-[14px] bg-white px-8 py-5 text-lg font-bold text-indigo-700 shadow-lg transition hover:bg-indigo-50"
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
              className="rounded-[14px] border border-white/20 bg-white/10 px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Recevoir ce rapport par email
            </button>
            {showEmailForm && (
              <form onSubmit={handleSendEmail} className="rounded-[12px] border border-white/20 bg-white/10 p-4 text-sm">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="prenom@entreprise.fr"
                  className="w-full rounded-xl border border-white/30 bg-transparent px-3 py-2 text-white placeholder-white/40 focus:border-white"
                  required
                />
                <button
                  type="submit"
                  className="mt-3 w-full rounded-xl bg-white/20 py-2 font-semibold text-white transition hover:bg-white/30"
                >
                  {emailStatus === "loading" ? "Envoi..." : "Envoyer →"}
                </button>
                {emailStatus === "success" && <p className="mt-2 text-center text-xs text-white">✓ Rapport envoyé !</p>}
                {emailStatus === "error" && <p className="mt-2 text-center text-xs text-red-200">Erreur lors de l'envoi.</p>}
              </form>
            )}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-white/40">🔒 Paiement sécurisé Stripe</p>
      </div>
    </motion.div>
  );
}

