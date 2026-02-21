import Link from "next/link";
import { ArrowRight, Check, Sparkles, Star } from "lucide-react";
import { ScoreAnimation } from "@/components/score-animation";
import { FadeIn } from "@/components/fade-in";
import { AuditForm } from "@/components/audit-form";
import { CheckoutButton } from "@/components/checkout-button";

const problemPoints = [
  "Un client cherche votre service sur ChatGPT → vous n'apparaissez pas",
  "Vos données sont illisibles par les agents IA",
  "Vos concurrents prennent votre place sans le savoir"
];

const steps = [
  "Entrez l'URL de votre site → audit gratuit lancé",
  "Recevez votre score + rapport PDF en 24h",
  "Choisissez votre pack de mise en conformité",
  "Notre agent corrige et optimise votre visibilité IA automatiquement"
];

const personas = ["Freelances", "Agences", "PME-TPE", "Artisans", "Professions libérales", "E-commerce"];

const pricing = [
  {
    name: "Starter",
    price: "490€ HT",
    cadence: "one-shot",
    features: [
      "Structuration données",
      "Endpoint MCP basique",
      "Rapport de conformité",
      "Score garanti >60/100"
    ],
    priceKey: "starter" as const
  },
  {
    name: "Pro",
    price: "790€ HT",
    cadence: "one-shot",
    features: [
      "Tout Starter inclus",
      "Endpoint MCP complet + API key privée",
      "Optimisation schema.org + métadonnées IA",
      "Score garanti >80/100"
    ],
    priceKey: "pro" as const,
    recommended: true
  },
  {
    name: "Maintenance",
    price: "79€ HT",
    cadence: "/mois",
    features: [
      "Monitoring visibilité IA mensuel",
      "Mises à jour automatiques",
      "Alertes si score baisse",
      "Rapport mensuel"
    ],
    priceKey: "maintenance" as const,
    note: "Inclus avec tout pack la 1ère année"
  }
];

const testimonials = [
  {
    label: "Freelance UX designer — Paris",
    delta: "12 → 81",
    quote: "J'apparais maintenant quand on cherche un designer sur Perplexity."
  },
  {
    label: "Agence immobilière — Bordeaux",
    delta: "19 → 74",
    quote: "3 nouveaux mandats en 6 semaines."
  },
  {
    label: "Cabinet dentaire — Lyon",
    delta: "22 → 68",
    quote: "Mes nouveaux patients me disent qu'une IA les a orientés vers moi."
  }
];

const faq = [
  {
    question: "C'est vraiment gratuit l'audit ?",
    answer: "Oui. Le rapport PDF et le score Agent-Readiness sont offerts. Aucun moyen de paiement demandé."
  },
  {
    question: "Combien de temps prend l'audit ?",
    answer: "24h maximum. Ton rapport part directement dans ta boîte mail pro."
  },
  {
    question: "Que contient le rapport exactement ?",
    answer: "Score détaillé, erreurs détectées, données illisibles pour les IA, estimation business perdue et plan d'action."
  },
  {
    question: "Comment fonctionne la mise en conformité automatique ?",
    answer: "Notre agent IA génère un endpoint MCP + métadonnées adaptées, pousse les correctifs et vérifie le nouveau score."
  },
  {
    question: "Sous quel délai mon score s'améliore-t-il ?",
    answer: "48h pour tout pack payé. Tu reçois un rapport de conformité + nouvelle note garantie."
  },
  {
    question: "Ça fonctionne pour mon secteur ?",
    answer: "Si tu as un site web, oui. Nous couvrons les secteurs listés et tous les sites compatibles schema.org."
  }
];

const calendlyUrl = process.env.CALENDLY_URL || "#";

export default function Page() {
  return (
    <main className="bg-background">
      {/* HERO */}
      <section id="hero" className="mx-auto max-w-6xl px-6 pb-16 pt-20 md:pt-32">
        <FadeIn>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs text-white/60">
            <Sparkles className="h-4 w-4 text-accent" /> Agentable · Audit IA obligatoire en 2025
          </p>
          <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h1 className="text-3xl font-semibold leading-tight text-white md:text-5xl">
                Votre site existe sur Google. Mais existe-t-il pour ChatGPT, Perplexity et les agents IA qui recommandent vos concurrents à vos futurs clients ?
              </h1>
              <p className="mt-6 text-lg text-white/80">
                Découvrez votre score de visibilité IA gratuitement en 24h. Sans engagement.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a href="#audit" className="inline-flex items-center gap-2 rounded-2xl bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-indigo-400">
                  Obtenir mon audit gratuit
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a href="#pricing" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-6 py-3 text-base font-semibold text-white transition hover:border-white">
                  Voir les offres
                </a>
              </div>
            </div>
            <ScoreAnimation />
          </div>
        </FadeIn>
      </section>

      {/* PROBLEM */}
      <section className="section border-t border-white/5" id="problem">
        <div className="mx-auto max-w-6xl px-6">
          <FadeIn>
            <div className="grid gap-6 md:grid-cols-3">
              {problemPoints.map((point, index) => (
                <div key={point} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80">
                  <div className="text-sm text-accent">0{index + 1}</div>
                  <p className="mt-4 text-lg text-white">{point}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section" id="process">
        <div className="mx-auto max-w-6xl px-6">
          <FadeIn>
            <div className="space-y-8">
              <h2 className="text-3xl font-semibold text-white">Comment ça marche</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {steps.map((step, index) => (
                  <div key={step} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <div className="flex items-center gap-3 text-accent">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/40 text-lg font-semibold">
                        {index + 1}
                      </span>
                      Étape {index + 1}
                    </div>
                    <p className="mt-4 text-lg text-white">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* REPORT EXAMPLE */}
      <section className="section border-y border-white/5" id="report">
        <div className="mx-auto max-w-5xl px-6">
          <FadeIn>
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 text-white">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-white/60">Extrait de rapport</p>
                  <p className="text-4xl font-semibold text-danger">Score 34/100</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-2 text-sm text-white/80">Valeur business estimée perdue : 2 400€/mois</div>
              </div>
              <ul className="mt-6 space-y-3 text-white/80">
                <li>• Données produit illisibles par les IA</li>
                <li>• Aucun endpoint MCP ni schema.org exploitable</li>
                <li>• Métadonnées obsolètes → score confiance très faible</li>
              </ul>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                <p className="text-white/70">Corrigez ces points et passez directement en zone verte.</p>
                <a href="#pricing" className="inline-flex items-center gap-2 text-accent">
                  Corriger mon score →
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* PERSONAS */}
      <section className="section" id="personas">
        <div className="mx-auto max-w-6xl px-6">
          <FadeIn>
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-accent">Pour qui ?</p>
              <h2 className="text-3xl font-semibold text-white">Si vous avez un site, vous avez besoin d'un score Agentable.</h2>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {personas.map((persona) => (
                <div key={persona} className="rounded-2xl border border-white/10 bg-white/5 px-6 py-8 text-center text-lg text-white/90">
                  {persona}
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FORM */}
      <section className="section border-t border-white/5" id="audit">
        <div className="mx-auto max-w-4xl px-6">
          <FadeIn>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <p className="text-sm uppercase tracking-[0.3em] text-accent">Audit gratuit</p>
              <h2 className="mt-4 text-3xl font-semibold">Recevez votre score en 24h</h2>
              <AuditForm />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* PRICING */}
      <section className="section" id="pricing">
        <div className="mx-auto max-w-6xl px-6">
          <FadeIn>
            <div className="text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-accent">Passez à l'action après votre audit</p>
              <h2 className="mt-4 text-3xl font-semibold">
                Mise en conformité réalisée automatiquement par notre agent IA sous 48h
              </h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {pricing.map((plan) => (
                <div
                  key={plan.name}
                  className={`flex flex-col rounded-3xl border ${
                    plan.recommended ? "border-accent shadow-glow" : "border-white/10"
                  } bg-white/5 p-6 text-white`}
                >
                  {plan.recommended && (
                    <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/40 px-3 py-1 text-xs text-accent">
                      <Star className="h-3.5 w-3.5" /> Recommandé
                    </span>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm text-white/60">{plan.cadence}</p>
                    <h3 className="text-3xl font-semibold">{plan.name}</h3>
                    <p className="text-4xl font-semibold">{plan.price}</p>
                  </div>
                  <ul className="mt-6 space-y-3 text-sm text-white/80">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 text-accent" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.note && <p className="mt-4 text-sm text-white/60">{plan.note}</p>}
                  <div className="mt-8">
                    <CheckoutButton
                      label={plan.name === "Maintenance" ? "Ajouter à mon pack" : "Acheter maintenant"}
                      priceKey={plan.priceKey}
                      variant={plan.recommended ? "primary" : "outline"}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center text-sm text-white/70">
              Vous avez des questions ?{" "}
              <Link href={calendlyUrl} className="text-accent" target="_blank">
                Réserver un appel gratuit
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="section border-y border-white/5" id="social-proof">
        <div className="mx-auto max-w-6xl px-6">
          <FadeIn>
            <h2 className="text-3xl font-semibold text-white">Ils sont passés de l'ombre à la lumière IA</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {testimonials.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-sm text-white/60">{item.label}</p>
                  <p className="mt-2 text-lg text-success">Score {item.delta}</p>
                  <p className="mt-4 text-white/80">“{item.quote}”</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" id="faq">
        <div className="mx-auto max-w-5xl px-6">
          <FadeIn>
            <h2 className="text-3xl font-semibold text-white">FAQ</h2>
            <div className="mt-6 space-y-4">
              {faq.map((item) => (
                <details key={item.question} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <summary className="cursor-pointer list-none text-lg font-medium text-white">
                    {item.question}
                  </summary>
                  <p className="mt-3 text-white/70">{item.answer}</p>
                </details>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="section border-t border-white/5" id="cta-final">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <FadeIn>
            <h2 className="text-3xl font-semibold text-white">
              Si vous avez un site, vous méritez d'être visible partout — y compris sur les IA.
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a href="#audit" className="rounded-2xl bg-accent px-6 py-3 text-base font-semibold text-white">
                Obtenir mon audit gratuit
              </a>
              <a href="#pricing" className="rounded-2xl border border-white/20 px-6 py-3 text-base font-semibold text-white">
                Voir les offres
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-sm text-white/60">
          <p>Agentable · © 2025</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/mentions-legales" className="text-white/80">
              Mentions légales
            </Link>
            <a href="mailto:contact@agentable.fr" className="text-white/80">
              Contact
            </a>
            <Link href={calendlyUrl} className="text-accent" target="_blank">
              Besoin d'aide ? Parlons-en
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
