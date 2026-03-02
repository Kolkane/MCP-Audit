"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { Check, Database, FileText, Gauge as GaugeIcon, Mail, MapPin, MessageSquare, Share2 } from "lucide-react";

import { AnalyzeResponse } from "@/components/hero-analyzer-context";
import { MAINTENANCE_PRICE } from "@/lib/pricing";

type CriteriaDetails = NonNullable<AnalyzeResponse["criteresDetail"]>;

const CRITERIA_META = {
  schemaOrg: { label: "Schema.org", icon: Database },
  nap: { label: "Données NAP", icon: MapPin },
  metadata: { label: "Métadonnées", icon: FileText },
  faq: { label: "FAQ structurée", icon: MessageSquare },
  vitesse: { label: "Vitesse & accessibilité", icon: GaugeIcon },
  citations: { label: "Autorité & citations", icon: Share2 }
} as const;

type ResultReportProps = {
  result: AnalyzeResponse;
  checkoutLoading: "activation" | "maintenance" | null;
  onCheckout: (withMaintenance: boolean) => Promise<void>;
};

const blockMotion = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay }
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

  const severityColor = result.score > 60 ? "text-[#4ADE80]" : result.score >= 40 ? "text-[#FB923C]" : "text-[#F87171]";

  const animatedScore = useCountUp(result.score, 1200);
  const animatedMonthlyLoss = useCountUp(monthlyLoss, 1000);

  const explanation = useMemo(() => {
    if (result.explanation) return result.explanation;
    const fallbacks = result.issues ?? [];
    if (!fallbacks.length) return "Votre site présente plusieurs lacunes qui empêchent les IA de le recommander.";
    return fallbacks.join(" · ");
  }, [result.explanation, result.issues]);

  const criteres = (Object.entries(CRITERIA_META) as [keyof CriteriaDetails, (typeof CRITERIA_META)[keyof typeof CRITERIA_META]][]).map(([key, meta]) => {
    const detail = criteresDetail?.[key];
    const score = detail?.score ?? 10;
    const status = score < 9 ? "✗ Action requise" : score < 14 ? "⚠ À améliorer" : "✓ Correct";
    const statusColor = score < 9 ? "bg-red-50 text-red-600" : score < 14 ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600";
    const lines = buildLines(key, detail);
    return { key, meta, detail, score, status, statusColor, progress: Math.min(100, (score / 20) * 100), lines };
  });

  const corrections = result.corrections ?? [];
  const includedItems = [
    "Schema.org JSON-LD généré",
    "Fichier llms.txt optimisé",
    "Métadonnées corrigées",
    "Rapport PDF complet"
  ];

  const guarantees = ["Paiement sécurisé Stripe", "Facture HT disponible", "Remboursement si non livré"];


  const handleSendEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !result.url) return;
    setEmailStatus('loading');
    try {
      const payload = {
        firstName: 'Audit',
        email,
        website: result.url,
        structure: 'Rapport automatique',
        auditId: result.auditId
      };
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('send_error');
      setEmailStatus('success');
    } catch (err) {
      console.error(err);
      setEmailStatus('error');
    }
  };

  return (
    <div className="mx-auto mt-8 flex w-full max-w-4xl flex-col gap-8 px-6">
      <motion.section {...blockMotion(0)} className="flex flex-col gap-6 overflow-hidden rounded-3xl border border-white/10 bg-[#0F172A] p-8 text-white md:flex-row">
        <div className="flex-1 space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Audit GEO</p>
          <p className={clsx("text-7xl font-black", result.score > 60 ? "text-emerald-300" : result.score >= 40 ? "text-orange-300" : "text-red-300")}>{animatedScore}</p>
          <span className={clsx("inline-flex rounded-full px-4 py-1 text-sm font-semibold", result.score > 60 ? "bg-green-500/15 text-green-400" : result.score >= 40 ? "bg-orange-500/15 text-orange-400" : "bg-red-500/15 text-red-400")}>{result.score > 60 ? "Site bien structuré" : result.score >= 40 ? "À optimiser" : "Score critique"}</span>
          <p className="text-sm text-white/40 max-w-xs">{explanation}</p>
        </div>
        <div className="flex w-56 flex-col gap-2">
          <Metric label="Critères en échec" value={`${failingCriteria}/6`} />
          <Metric label="Perte estimée" value={`-${formattedMonthlyLoss}€/mois`} />
          <Metric label="Priorité" value={priority} extraClass={priorityColor} />
        </div>
        <div className="hidden overflow-hidden rounded-2xl border border-white/10 p-4 md:flex">
          <ScoreGauge value={result.score} />
        </div>
      </motion.section>

      <motion.section {...blockMotion(0.12)} className="space-y-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Analyse par critère</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {criteres.map((criterion, index) => (
              <div key={criterion.key} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                  <span className="flex items-center gap-2">
                    <criterion.meta.icon className="h-4 w-4" />
                    {criterion.meta.label}
                  </span>
                  <span>{criterion.score}/20</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200">
                  <motion.div
                    className={clsx("h-full rounded-full", criterion.score < 9 ? "bg-gradient-to-r from-red-400 to-red-500" : criterion.score < 14 ? "bg-gradient-to-r from-orange-400 to-orange-500" : "bg-gradient-to-r from-emerald-400 to-emerald-500")}
                    initial={{ width: 0 }}
                    animate={{ width: `${criterion.progress}%` }}
                    transition={{ duration: 0.8, delay: index * 0.05 }}
                  />
                </div>
                <div className="mt-2 space-y-1 text-xs text-slate-500">
                  {criterion.lines.slice(0, 3).map((line, idx) => (
                    <p key={idx}>{line.text}</p>
                  ))}
                </div>
                <span className={clsx("mt-2 inline-flex rounded-full px-2 py-0.5 text-xs", criterion.status.includes("Action") ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600")}>{criterion.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-6">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Perte mensuelle</p>
              <p className="text-4xl font-black text-red-500">-{formattedMonthlyLoss}€</p>
              <p className="text-sm text-slate-500">Soit -{formattedYearlyLoss}€ / an</p>
            </div>
            <div className="rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-600">
              ROI +{new Intl.NumberFormat("fr-FR").format(Math.max(0, yearlyLoss - result.priceActivation))}€<br />Rentabilisé mois 1
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section {...blockMotion(0.24)} className="rounded-2xl border border-slate-100 bg-white p-6">
        <div className="grid grid-cols-2 gap-4">
          {corrections.slice(0, 4).map((correction, index) => (
            <div key={index} className="rounded-xl border border-slate-100 p-4">
              <p className="text-sm font-semibold text-slate-900">{correction.probleme}</p>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">{correction.solution}</p>
              <span className={clsx("mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", correction.impact === "critique" ? "bg-red-50 text-red-600" : correction.impact === "important" ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600")}>{correction.impact === "critique" ? "🔴 Critique" : correction.impact === "important" ? "🟠 Important" : "🔵 Utile"}</span>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section {...blockMotion(0.36)} className="space-y-5 rounded-3xl border border-white/10 bg-[#0F172A] p-8 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Votre mise en conformité GEO</p>
            <p className="text-5xl font-black">{formattedActivation}€</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-white/70">
            {includedItems.map((item) => (
              <span key={item} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1">
                <Check className="h-3 w-3 text-indigo-200" /> {item}
              </span>
            ))}
          </div>
        </div>
        <label className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/5 p-4 text-sm">
          <input
            type="checkbox"
            checked={addMaintenance}
            onChange={(e) => setAddMaintenance(e.target.checked)}
            className="mt-1 h-5 w-5 flex-shrink-0 accent-indigo-400"
          />
          <div>
            <p className="font-semibold">Maintenance mensuelle</p>
            <p className="text-xs text-white/60">+79€ HT/mois · sans engagement</p>
            <p className="text-xs text-white/50">Total : <span className="text-lg font-bold text-white">{formattedTotalToday}€ HT</span></p>
          </div>
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => onCheckout(addMaintenance)}
            className="w-full rounded-xl bg-white px-6 py-4 text-base font-bold text-indigo-700"
          >
            Payer {formattedTotalToday}€ →
          </button>
          <button
            type="button"
            onClick={() => setShowEmailForm((prev) => !prev)}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-6 py-4 text-sm font-semibold"
          >
            Recevoir ce rapport par email →
          </button>
        </div>
        <AnimatePresence initial={false}>
          {showEmailForm && (
            <motion.form
              onSubmit={handleSendEmail}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="votre@email.fr"
                className="w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-sm"
              />
              <button type="submit" className="w-full rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold">
                {emailStatus === "loading" ? "Envoi..." : "Envoyer →"}
              </button>
              {emailStatus === "success" && <p className="text-xs text-white/70">Rapport envoyé</p>}
              {emailStatus === "error" && <p className="text-xs text-red-300">Erreur d'envoi</p>}
            </motion.form>
          )}
        </AnimatePresence>
        <div className="text-xs text-white/40">
          {guarantees.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </motion.section>
    </div>
  );
}

function buildLines(key: keyof CriteriaDetails, detail?: CriteriaDetails[keyof CriteriaDetails]) {
  if (!detail) return [{ text: "Données insuffisantes", type: "neutral" as const }];
  const lines: Array<{ text: string; type: "positive" | "negative" | "neutral" }> = [];

  switch (key) {
    case "schemaOrg": {
      const schema = detail as CriteriaDetails["schemaOrg"];
      if (schema.found?.length) {
        lines.push({ text: `✓ Trouvé : ${schema.found.join(", ")}`, type: "positive" });
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
      lines.push({ text: faq.hasStructured ? `✓ ${faq.questionsCount} questions structurées détectées` : "✗ Aucune FAQ structurée trouvée", type: faq.hasStructured ? "positive" : "negative" });
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
      lines.push({ text: citations.socialLinks?.length ? `✓ Réseaux : ${citations.socialLinks.join(", ")}` : "✗ Aucun réseau social lié", type: citations.socialLinks?.length ? "positive" : "negative" });
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

function Metric({ label, value, extraClass }: { label: string; value: string; extraClass?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs uppercase tracking-[0.3em] text-white/40">{label}</p>
      <p className={clsx("text-sm font-semibold text-white", extraClass)}>{value}</p>
    </div>
  );
}

function ScoreGauge({ value }: { value: number }) {
  const ratio = Math.min(100, Math.max(0, value)) / 100;
  const dash = 2 * Math.PI * 55;
  const severity = value > 60 ? "#4ADE80" : value >= 40 ? "#FB923C" : "#F87171";
  return (
    <svg width="120" height="120" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r="55" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
      <circle
        cx="70"
        cy="70"
        r="55"
        fill="none"
        stroke={severity}
        strokeWidth="12"
        strokeDasharray={dash}
        strokeDashoffset={dash - dash * ratio}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
      />
    </svg>
  );
}
