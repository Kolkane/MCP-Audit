"use client";

import { useState } from "react";
import { Loader2, AlertCircle, Mail } from "lucide-react";
import { CheckoutButton } from "@/components/checkout-button";
import { MAINTENANCE_PRICE } from "@/lib/pricing";
import clsx from "clsx";

interface AnalyzeResponse {
  score: number;
  issues: string[];
  priceActivation: number;
  stripePrice?: string | null;
  maintenancePrice?: number;
  stripeMaintenance?: string | null;
  level?: string;
  timeout?: boolean;
}

const severityMap = {
  low: {
    label: "⚠ Score critique",
    color: "text-danger",
    pill: "bg-red-50 border border-red-200 text-red-600"
  },
  medium: {
    label: "〜 Score moyen",
    color: "text-warning",
    pill: "bg-orange-50 border border-orange-200 text-orange-600"
  },
  high: {
    label: "✓ Bon score",
    color: "text-success",
    pill: "bg-green-50 border border-green-200 text-green-600"
  }
};

function getSeverity(score: number) {
  if (score > 60) return severityMap.high;
  if (score >= 40) return severityMap.medium;
  return severityMap.low;
}

function getStrokeDashoffset(score: number) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  return circumference - (Math.min(score, 100) / 100) * circumference;
}

export function HeroAnalyzer() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!url) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setShowEmailForm(false);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      if (!response.ok) {
        throw new Error("Analyse impossible");
      }
      const data = (await response.json()) as AnalyzeResponse;
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Impossible d'analyser cette URL pour l'instant. Réessaie dans un instant.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !url) return;
    setEmailStatus("loading");
    try {
      const payload = {
        firstName: "Audit",
        email,
        website: url,
        structure: "Automatique"
      };
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error();
      setEmailStatus("success");
    } catch (error) {
      console.error(error);
      setEmailStatus("error");
    }
  };

  const severity = getSeverity(result?.score ?? 0);
  const activationPrice = result?.priceActivation ?? 249;
  const maintenancePrice = result?.maintenancePrice ?? MAINTENANCE_PRICE;

  return (
    <div className="mt-8 w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
        <div className="flex flex-col overflow-hidden rounded-xl border border-[#E2E8F0] bg-white md:flex-row">
          <input
            type="url"
            required
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://votresite.fr"
            className="flex-1 border-none px-4 py-3 text-base text-night focus:outline-none"
          />
          <button
            type="submit"
            className="bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-[#4F46E5]"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Analyser gratuitement →"}
          </button>
        </div>
        <p className="text-center text-sm text-slate">⚡ Résultat en 60 secondes · 100% gratuit · Sans inscription</p>
      </form>
      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}
      <div className="mt-8">
        {loading && (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-6 py-5 text-slate">
            <Loader2 className="h-5 w-5 animate-spin text-accent" /> Analyse en cours...
          </div>
        )}
        {!loading && result && (
          <div className="space-y-4">
            <div className="w-full rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(99,102,241,0.12)]">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="relative h-[120px] w-[120px]">
                    <svg width="120" height="120">
                      <circle
                        cx="60"
                        cy="60"
                        r="52"
                        stroke="#F1F5F9"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="52"
                        stroke={result.score > 60 ? "#22C55E" : result.score >= 40 ? "#F97316" : "#EF4444"}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={2 * Math.PI * 52}
                        strokeDashoffset={getStrokeDashoffset(result.score)}
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)"
                      />
                      <text x="50%" y="50%" textAnchor="middle" alignmentBaseline="middle" className="fill-night text-2xl font-black">
                        {result.score}
                      </text>
                    </svg>
                  </div>
                  <span className={clsx("rounded-full px-3 py-1 text-sm", severity.pill)}>{severity.label}</span>
                </div>
                <div className="flex flex-col gap-3">
                  <h4 className="text-sm font-semibold text-night">3 problèmes détectés :</h4>
                  <ul className="space-y-2 text-sm text-night">
                    {result.issues?.slice(0, 3).map((issue) => (
                      <li key={issue} className="flex items-start gap-2">
                        <span className="text-danger">✕</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    💸 Valeur business perdue estimée : <span className="font-semibold">2 400€/mois</span>
                  </div>
                  <div className="text-sm text-slate">
                    Prix d'activation estimé : <span className="font-semibold">{activationPrice}€ HT</span>
                  </div>
                  <div className="text-sm text-slate">
                    Option monitoring mensuel : <span className="font-semibold">{maintenancePrice}€ HT/mois</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {result.stripePrice && (
                  <CheckoutButton
                    label={`Lancer ma mise en conformité — ${activationPrice}€ HT`}
                    priceId={result.stripePrice}
                    mode="payment"
                  />
                )}
                {result.stripeMaintenance && (
                  <CheckoutButton
                    label={`Ajouter la maintenance (${maintenancePrice}€ HT/mois)`}
                    priceId={result.stripeMaintenance}
                    mode="subscription"
                    variant="outline"
                  />
                )}
                <button
                  onClick={() => setShowEmailForm((prev) => !prev)}
                  className="w-full rounded-2xl border border-accent px-5 py-3 text-sm font-semibold text-accent transition hover:bg-indigo-50"
                >
                  Recevoir le rapport complet gratuit par email →
                </button>
                {showEmailForm && (
                  <form onSubmit={handleSendReport} className="space-y-3 rounded-2xl border border-[#E2E8F0] bg-[#F8F9FF] p-4 text-sm">
                    <div>
                      <label className="text-xs font-semibold text-slate">Email professionnel</label>
                      <div className="mt-1 flex gap-2">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className="flex-1 rounded-xl border border-border px-3 py-2 focus:border-accent focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 font-semibold text-white"
                        >
                          {emailStatus === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                          Envoyer
                        </button>
                      </div>
                    </div>
                    {emailStatus === "success" && <p className="text-sm text-success">📬 Rapport envoyé sous 24h !</p>}
                    {emailStatus === "error" && <p className="text-sm text-danger">Erreur lors de l'envoi. Réessaie.</p>}
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
