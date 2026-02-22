import Link from "next/link";
import { Check, MessageCircle } from "lucide-react";

const activationRanges = [
  { label: "Score >60", price: 249, note: "Site bien structuré", color: "text-green-600" },
  { label: "Score 40-60", price: 390, note: "Optimisations modérées", color: "text-orange-500" },
  { label: "Score <40", price: 590, note: "Refonte complète", color: "text-red-600" }
];

const maintenanceFeatures = [
  "Monitoring visibilité IA mensuel",
  "Mises à jour automatiques",
  "Alertes si score baisse",
  "Rapport mensuel détaillé",
  "Priorité de traitement"
];

export function PricingPlans({ calendlyUrl }: { calendlyUrl: string }) {
  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-xl rounded-2xl border border-[#E2E8F0] bg-[#F8F9FF] p-4">
        <p className="mb-3 text-center text-sm font-semibold text-slate">
          💡 Votre prix est calculé automatiquement selon votre score
        </p>
        <div className="space-y-2 text-sm">
          {activationRanges.map((range) => (
            <div key={range.label} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
              <span className="font-semibold text-night">{range.label}</span>
              <span className={`${range.color} font-semibold`}>{range.price}€ HT · {range.note}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="flex h-full flex-col rounded-2xl border border-border bg-white p-6">
          <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-semibold text-slate">Frais d'activation</span>
          <h3 className="mt-4 text-3xl font-semibold text-night">One-shot</h3>
          <p className="mt-2 text-base text-slate">Payez une seule fois selon votre score</p>
          <div className="my-6 h-px w-full bg-border" />
          <ul className="space-y-3 text-sm text-night">
            {["Analyse complète de votre site", "Mise en conformité livrée en 48h", "Endpoint MCP + schema.org", "Score garanti >80/100", "Rapport de conformité final"].map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <Check className="h-4 w-4 text-success" />
                {feature}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs italic text-slate">Prix exact affiché automatiquement après l'analyse de votre URL.</p>
          <Link
            href="#hero"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white"
          >
            Analyser mon site →
          </Link>
        </div>

        <div className="flex h-full flex-col rounded-2xl border border-accent bg-white p-6 shadow-glowStrong">
          <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">Option recommandée</span>
          <h3 className="mt-4 text-3xl font-semibold text-night">Maintenance</h3>
          <p className="text-4xl font-bold text-night">79€ <span className="text-base font-medium text-slate">/mois</span></p>
          <p className="text-sm text-slate">Sans engagement — résiliable en 1 clic</p>
          <div className="my-6 h-px w-full bg-border" />
          <ul className="space-y-3 text-sm text-night">
            {maintenanceFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <Check className="h-4 w-4 text-success" />
                {feature}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs italic text-success">Maintient votre score &gt;80/100 toute l'année.</p>
          <Link
            href="#hero"
            className="mt-6 inline-flex items-center justify-center rounded-2xl border border-accent px-5 py-3 text-sm font-semibold text-accent"
          >
            Ajouter après mon audit →
          </Link>
        </div>

        <div className="flex h-full flex-col rounded-2xl border border-dashed border-[#C7D2FE] bg-[#F8F9FF] p-6">
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">Gratuit</span>
          <h3 className="mt-4 text-2xl font-bold text-night">Une question ?</h3>
          <p className="text-4xl font-black text-night">0€</p>
          <p className="text-sm text-slate">Appel de 20 min</p>
          <p className="mt-2 text-sm italic text-slate">Vous préférez en parler avant de vous lancer ?</p>
          <div className="my-6 h-px w-full border border-dashed border-[#E2E8F0]" />
          <ul className="space-y-3 text-sm text-night">
            {["Analyse de votre situation en direct", "Réponses à toutes vos questions", "Recommandation personnalisée", "Sans engagement, sans pression"].map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <MessageCircle className="h-4 w-4 text-accent" />
                {feature}
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Link
              href={calendlyUrl}
              target="_blank"
              className="block w-full rounded-2xl border border-accent px-5 py-3 text-center text-sm font-semibold text-accent transition hover:bg-indigo-50"
            >
              Réserver mon appel gratuit →
            </Link>
          </div>
          <p className="mt-3 text-center text-xs text-[#94A3B8]">⏱ Disponible sous 24h</p>
        </div>
      </div>
    </div>
  );
}
