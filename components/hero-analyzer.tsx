"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, AlertCircle, Check, Circle } from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";

import { MAINTENANCE_PRICE } from "@/lib/pricing";
import { useHeroAnalyzer } from "@/components/hero-analyzer-context";
import ResultReport from "@/components/result-report";

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

export function HeroAnalyzer({ simpleOnly = false }: { simpleOnly?: boolean } = {}) {
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
      <form onSubmit={handleSubmit} className={clsx("flex w-full flex-col gap-3", simpleOnly ? "max-w-lg mx-auto mt-0" : "mx-auto mt-8 max-w-xl sm:flex-row")}> 
        <input
          type="url"
          required
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://votre-site.fr"
          className={clsx(
            "rounded-[14px] border-2 border-[#E2E8F0] bg-white px-5 py-4 text-base text-night placeholder:text-[#94A3B8] focus:border-indigo-400 focus:outline-none",
            simpleOnly ? "w-full shadow-sm" : "flex-1"
          )}
        />
        <button
          type="submit"
          className={clsx(
            "rounded-[14px] bg-indigo-600 py-4 text-base font-bold text-white transition hover:bg-indigo-700 shadow-[0_4px_16px_rgba(99,102,241,0.35)]",
            simpleOnly ? "w-full" : "px-8"
          )}
        >
          {analysisState === "loading" ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Analyser gratuitement →"}
        </button>
      </form>
      {!simpleOnly && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-[#94A3B8]">
          {HERO_BADGES.map((badge) => (
            <span key={badge.label} className="rounded-full bg-white/60 px-3 py-1 font-semibold">{badge.label}</span>
          ))}
        </div>
      )}
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
        <LoadingPanel url={url} progress={progress} />
      )}

      {analysisState === "done" && result && (
        <div className="mt-8 w-full max-w-6xl"><ResultReport result={result} checkoutLoading={checkoutLoading} onCheckout={handleCheckout} /></div>
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


