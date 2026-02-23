"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { MAINTENANCE_PRICE } from "@/lib/pricing";

const tiers = [
  {
    label: "Site simple (score >60) — quelques optimisations",
    price: "249€ HT",
    color: "text-[#15803D]"
  },
  {
    label: "Site moyen (score 40-60) — refonte partielle",
    price: "390€ HT",
    color: "text-[#F97316]"
  },
  {
    label: "Site complexe (score <40) — restructuration complète",
    price: "590€ HT",
    color: "text-[#EF4444]"
  }
];

const maintenanceFeatures = [
  "Monitoring score mensuel automatisé",
  "Mises à jour dès qu'un critère baisse",
  "Rapport mensuel + alertes en temps réel"
];

type AnalysisResult = {
  auditId: string;
  score: number;
  level: string;
  priceActivation: number;
  explanation: string;
};

export function PricingPlans({ calendlyUrl }: { calendlyUrl: string }) {
  const [url, setUrl] = useState("");
  const [analysisState, setAnalysisState] = useState<"idle" | "loading" | "done">("idle");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [addMaintenance, setAddMaintenance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setAnalysisState("loading");
    setError(null);
    setAddMaintenance(false);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        throw new Error("Analyse impossible");
      }

      const data = (await response.json()) as AnalysisResult & { auditId?: string };
      if (!data.auditId) {
        throw new Error("Réponse incomplète");
      }

      setAnalysis({
        auditId: data.auditId,
        level: data.level,
        priceActivation: data.priceActivation,
        score: data.score,
        explanation: data.explanation || "Votre site nécessite quelques corrections pour rester visible sur les IA."
      });
      setAnalysisState("done");
    } catch (err) {
      console.error(err);
      setError("Impossible d'analyser cette URL pour l'instant. Réessaie dans un instant.");
      setAnalysisState("idle");
    }
  };

  const handleCheckout = async () => {
    if (!analysis) return;
    setCheckoutLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId: analysis.auditId, addMaintenance })
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
      setCheckoutLoading(false);
    }
  };

  const scrollToPricingForm = () => {
    document.getElementById("pricing-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="mx-auto mt-10 max-w-3xl space-y-6">
      <div id="pricing-form" className="rounded-3xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate">Mise en conformité</p>
            <h3 className="mt-3 text-4xl font-black text-night">À partir de 249€ HT</h3>
            <p className="mt-2 text-sm text-[#64748B]">Le prix exact dépend de votre site — analysez gratuitement pour le connaître.</p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-accent">Score garanti &gt;80/100</span>
        </div>
        <div className="my-6 h-px w-full bg-[#F1F5F9]" />
        <p className="text-sm text-[#64748B]">Notre agent évalue 8 critères techniques. Le prix varie selon :</p>
        <div className="mt-4 space-y-2 text-sm text-night">
          {tiers.map((tier) => (
            <div key={tier.label} className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
              <span>{tier.label}</span>
              <span className={`text-sm font-semibold ${tier.color}`}>{tier.price}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs italic text-[#94A3B8]">Le volume de données et la taille de votre site peuvent également influencer le prix final.</p>
        <div className="my-6 h-px w-full bg-[#F1F5F9]" />
        <ul className="space-y-3 text-sm text-night">
          {["Analyse complète de votre site", "Conformité livrée en 48h", "Endpoint MCP + schema.org optimisé", "Score garanti >80/100"].map(
            (feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                {feature}
              </li>
            )
          )}
        </ul>
        <div className="mt-6">
          {analysisState === "done" && analysis ? (
            <div className="rounded-2xl bg-[#4F46E5] p-6 text-white">
              <p className="text-sm text-white/70">
                Votre score : <span className="font-semibold text-white">{analysis.score}/100 · {analysis.level}</span>
              </p>
              <p className="mt-2 text-3xl font-black">Votre prix : {analysis.priceActivation}€ HT</p>
              <p className="mt-2 text-xs text-white/70">{analysis.explanation}</p>
              <div className="mt-4 rounded-xl border border-white/20 bg-white/10 p-3">
                <label className="flex items-center justify-between text-sm font-semibold" htmlFor="maintenance-toggle">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="maintenance-toggle"
                      checked={addMaintenance}
                      onChange={(event) => setAddMaintenance(event.target.checked)}
                      className="h-4 w-4 accent-white"
                    />
                    Ajouter la maintenance
                  </span>
                  <span className="text-white/80">+{MAINTENANCE_PRICE}€ HT/mois</span>
                </label>
                <p className="ml-6 mt-1 text-xs text-white/70">Monitoring mensuel · Mises à jour · Alertes score · Sans engagement</p>
              </div>
              <div className="mt-3 text-sm text-white/70">
                <p>
                  Total aujourd'hui : <span className="text-2xl font-black text-white">{analysis.priceActivation}€ HT</span>
                </p>
                {addMaintenance && (
                  <p className="text-xs text-white/50">Puis {MAINTENANCE_PRICE}€ HT/mois · Sans engagement — résiliable en 1 clic</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                className="mt-4 w-full rounded-xl bg-white px-5 py-4 text-sm font-semibold text-accent"
                disabled={checkoutLoading}
              >
                {checkoutLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : `Payer ${analysis.priceActivation}€ et démarrer →`}
              </button>
              <p className="mt-2 text-center text-xs text-white/50">Paiement sécurisé Stripe · Facture HT</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#F8F9FF] p-6">
              <p className="text-base font-semibold text-night">Connaître mon prix exact</p>
              <p className="text-sm text-[#64748B]">Entrez votre URL — résultat en 60 secondes.</p>
              <div className="mt-4 flex flex-col gap-3 md:flex-row">
                <input
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://votre-site.fr"
                  className="flex-1 rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!url.trim() || analysisState === "loading"}
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                >
                  {analysisState === "loading" ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Analyser →"}
                </button>
              </div>
              {error && <p className="mt-3 text-xs text-danger">{error}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl bg-[#0F172A] p-8 text-white shadow-lg">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="md:w-2/3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">Maintenance mensuelle</p>
            <h3 className="mt-2 text-xl font-bold text-white">Pourquoi la maintenance est essentielle</h3>
            <p className="mt-3 text-sm text-white/60 leading-relaxed">
              Les algorithmes des IA évoluent chaque mois. Un site optimisé aujourd'hui peut perdre 30 points de score en 3 mois sans suivi.
            </p>
            <p className="mt-2 text-sm text-white/60 leading-relaxed">
              Sans maintenance, votre score baisse. Avec elle, il reste au-dessus de 80/100 toute l'année — automatiquement.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              {maintenanceFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-300" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div className="md:w-1/3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white">
              <p className="text-5xl font-black">79€</p>
              <p className="text-lg text-white/70">/mois</p>
              <p className="mt-1 text-xs text-white/60">Sans engagement · résiliable en 1 clic</p>
              <button
                type="button"
                onClick={() => {
                  setAddMaintenance(true);
                  scrollToPricingForm();
                }}
                className="mt-6 w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white"
              >
                Ajouter après mon audit →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-dashed border-[#C7D2FE] bg-[#F8F9FF] p-6 text-night">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-base font-bold text-night">Une question avant de vous lancer ?</p>
            <p className="text-sm text-slate">Appel gratuit · 20 min · sans engagement</p>
            <p className="text-xs text-[#94A3B8]">⏱ Disponible sous 24h</p>
          </div>
          <Link
            href={calendlyUrl}
            target="_blank"
            className="w-full rounded-xl border border-accent px-6 py-3 text-center text-sm font-semibold text-accent md:w-auto"
          >
            Réserver →
          </Link>
        </div>
      </div>
    </div>
  );
}
