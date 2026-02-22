import Link from "next/link";
import { ArrowRight, Briefcase, Building2, Check, Quote, ShoppingBag, Sparkles, Star, Stethoscope, User, Wrench, X } from "lucide-react";
import { FadeIn } from "@/components/fade-in";
import { ScoreAnimation } from "@/components/score-animation";
import { AuditForm } from "@/components/audit-form";
import { CheckoutButton } from "@/components/checkout-button";
import { Navbar } from "@/components/navbar";

const problemPoints = [
  {
    title: "Invisible sur ChatGPT",
    description: "Un client demande un prestataire → tes concurrents sortent, toi non.",
    icon: "ghost"
  },
  {
    title: "Données illisibles",
    description: "Les agents IA ne comprennent pas tes services ni tes offres.",
    icon: "database"
  },
  {
    title: "Parts de marché perdues",
    description: "Chaque requête IA devient un lead confié à quelqu'un d'autre.",
    icon: "users"
  }
];

const steps = [
  "Entrez l'URL de votre site → audit gratuit lancé",
  "Recevez votre score + rapport PDF en 24h",
  "Choisissez votre pack de mise en conformité",
  "Notre agent corrige et optimise votre visibilité IA automatiquement"
];

const personas = [
  { label: "Freelances", benefit: "Sois recommandé avant tes concurrents", icon: User },
  { label: "Agences", benefit: "Proposez l'audit en offre additionnelle", icon: Building2 },
  { label: "PME-TPE", benefit: "Capturez les clients IA", icon: Briefcase },
  { label: "Artisans", benefit: "Soyez trouvés même sans SEO avancé", icon: Wrench },
  { label: "Professions libérales", benefit: "Patients et clients vous trouvent", icon: Stethoscope },
  { label: "E-commerce", benefit: "Vos produits lus par les agents IA", icon: ShoppingBag }
];

const pricing = [
  {
    name: "One-shot",
    price: "590€",
    cadence: "Paiement unique",
    subtitle: "Je règle ça une fois pour toutes",
    features: [
      "Audit complet inclus",
      "Mise en conformité complète",
      "Endpoint MCP + schema.org optimisé",
      "Score garanti >80/100",
      "Rapport de conformité final",
      "Livraison sous 48h"
    ],
    priceKey: "oneShot" as const,
    variant: "primary"
  },
  {
    name: "Abonnement",
    price: "99€",
    cadence: "Sans engagement",
    subtitle: "Je reste visible en permanence",
    features: [
      "Mise en conformité initiale incluse",
      "Monitoring visibilité IA mensuel",
      "Mises à jour automatiques",
      "Alertes si score baisse",
      "Rapport mensuel détaillé",
      "Priorité de traitement"
    ],
    priceKey: "subscription" as const,
    recommended: true,
    variant: "outline",
    note: "Rentabilisé dès le 1er client trouvé via IA"
  }
];

const testimonials = [
  {
    label: "Freelance UX · Paris",
    delta: "12 → 81",
    quote: "J'apparais maintenant quand on cherche un designer sur Perplexity."
  },
  {
    label: "Agence immo · Bordeaux",
    delta: "19 → 74",
    quote: "3 nouveaux mandats signés en 6 semaines grâce aux recommandations IA."
  },
  {
    label: "Cabinet dentaire · Lyon",
    delta: "22 → 68",
    quote: "Mes nouveaux patients me citent ChatGPT comme source."
  }
];

const faq = [
  {
    question: "C'est vraiment gratuit l'audit ?",
    answer: "Oui. Score Agent-Readiness + rapport PDF détaillé. Aucun moyen de paiement demandé."
  },
  {
    question: "Combien de temps prend l'audit ?",
    answer: "24h chrono. Notre agent te livre le rapport directement par email pro."
  },
  {
    question: "Que contient le rapport ?",
    answer: "Score détaillé, lacunes techniques, estimation business perdu et plan d'action."
  },
  {
    question: "Comment fonctionne la mise en conformité automatique ?",
    answer: "Nos agents IA génèrent et testent un endpoint MCP + métadonnées optimisées pour les agents."
  },
  {
    question: "Sous quel délai mon score s'améliore ?",
    answer: "48h pour tout pack Starter ou Pro : tu reçois le rapport final avec la nouvelle note garantie."
  },
  {
    question: "Ça fonctionne pour mon secteur ?",
    answer: "Si tu as un site, oui. Nous couvrons freelances, agences, PME, e-commerce, artisans et professions libérales."
  }
];

const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com/agentable/demo";

export default function Page() {
  return (
    <main className="bg-background text-night">
      <Navbar />
      {/* HERO */}
      <section id="hero" className="relative bg-gradient-to-br from-white to-[#EEF2FF] pt-32">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 lg:flex-row lg:items-center">
          <FadeIn>
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
                ✦ Nouveau — Visibilité IA pour tous les sites
              </span>
              <h1 className="mt-6 text-4xl font-bold leading-tight text-night md:text-6xl">
                Votre site existe sur Google. Mais existe-t-il pour ChatGPT, Perplexity et les agents IA ?
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-slate">
                Obtenez votre score de visibilité IA gratuitement en 24h, puis laissez notre agent corriger vos données pour monopoliser les recommandations IA.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
                <a
                  href="#audit"
                  className="rounded-xl bg-accent px-7 py-4 text-base font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.25)] transition hover:bg-[#4F46E5]"
                >
                  Obtenir mon audit gratuit
                </a>
                <a
                  href="#pricing"
                  className="rounded-xl border border-accent px-7 py-4 text-base font-semibold text-accent transition hover:bg-[#EEF2FF]"
                >
                  Voir les offres
                </a>
              </div>
            </div>
          </FadeIn>
          <FadeIn>
            <div className="w-full lg:w-auto">
              <ScoreAnimation />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="section bg-surface" id="problem">
        <div className="mx-auto max-w-6xl px-6">
          <FadeIn>
            <div className="grid gap-6 md:grid-cols-3">
              {problemPoints.map((point, index) => (
                <div key={point.title} className="relative overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <span className="absolute right-4 top-4 text-6xl font-bold text-surface">0{index + 1}</span>
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF2FF] text-accent">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-night">{point.title}</h3>
                  <p className="mt-2 text-sm text-slate">{point.description}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* PROCESS */}
      <section className="section" id="process">
        <div className="mx-auto max-w-6xl px-6">
          <FadeIn>
            <h2 className="text-3xl font-semibold">Comment ça marche</h2>
            <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-start">
              {steps.map((step, index) => (
                <div key={step} className="relative flex-1">
                  {index < steps.length - 1 && (
                    <div className="absolute top-6 hidden w-full border-t-2 border-dashed border-accent/30 lg:block" />
                  )}
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-lg font-semibold text-white">
                      {index + 1}
                    </div>
                    <p className="text-base font-medium text-night">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* REPORT */}
      <section className="section" id="report">
        <div className="mx-auto max-w-5xl px-6">
          <FadeIn>
            <div className="relative">
              <div className="absolute inset-0 -rotate-2 rounded-3xl border border-border bg-white opacity-40"></div>
              <div className="relative rounded-3xl border border-border bg-white p-8 shadow-card">
                <div className="rounded-2xl bg-accent p-4 text-white">
                  <p className="text-sm uppercase tracking-[0.3em]">Rapport Agentable — Exemple</p>
                  <p className="text-4xl font-semibold">Score 34/100</p>
                </div>
                <div className="mt-6 h-3 w-full rounded-full bg-surface">
                  <div className="h-full w-1/3 rounded-full bg-danger" />
                </div>
                <ul className="mt-6 space-y-3 text-slate">
                  <li className="flex items-center gap-3 text-base text-danger">
                    <X className="h-4 w-4" /> Données illisibles par les IA
                  </li>
                  <li className="flex items-center gap-3 text-base text-danger">
                    <X className="h-4 w-4" /> Aucun endpoint MCP exploitable
                  </li>
                  <li className="flex items-center gap-3 text-base text-danger">
                    <X className="h-4 w-4" /> Métadonnées obsolètes → faible confiance
                  </li>
                </ul>
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-base font-semibold text-success">Valeur perdue estimée : 2 400€/mois</p>
                  <a href="#pricing" className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white">
                    Corriger mon score →
                  </a>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* PERSONAS */}
      <section className="section bg-surface" id="personas">
        <div className="mx-auto max-w-6xl px-6">
          <FadeIn>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {personas.map((persona) => {
                const Icon = persona.icon;
                return (
                  <div key={persona.label} className="rounded-2xl border border-border bg-white p-6 text-center shadow-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF2FF] text-accent">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-night">{persona.label}</h3>
                    <p className="mt-2 text-sm text-slate">{persona.benefit}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 flex items-center justify-center gap-3">
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">Si vous avez un site</span>
              <p className="text-base font-semibold text-night">Vous avez besoin d'un score Agentable.</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FORM */}
      <section className="section" id="audit">
        <div className="mx-auto max-w-5xl rounded-[32px] bg-gradient-to-br from-accent to-accentLight p-1">
          <div className="rounded-[30px] bg-white p-10">
            <FadeIn>
              <h2 className="text-3xl font-semibold text-night">Obtenez votre score gratuit</h2>
              <AuditForm />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section" id="pricing">
        <div className="mx-auto max-w-6xl px-6">
          <FadeIn>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Passez à l'action après votre audit</p>
              <h2 className="mt-3 text-3xl font-semibold text-night">Mise en conformité automatique sous 48h</h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {pricing.map((plan) => (
                <div
                  key={plan.name}
                  className={`flex flex-col rounded-2xl border bg-white p-6 transition hover:-translate-y-1 hover:shadow-card ${
                    plan.recommended ? "border-2 border-accent shadow-glowStrong scale-105" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-semibold text-slate">{plan.cadence}</span>
                    {plan.recommended && (
                      <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-semibold text-accent">Recommandé</span>
                    )}
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    <h3 className="text-3xl font-semibold text-night">{plan.name}</h3>
                    <p className="text-4xl font-bold text-night">{plan.price} <span className="text-base font-medium text-slate">HT</span></p>
                    <p className="text-sm text-slate">{plan.subtitle}</p>
                  </div>
                  <div className="my-6 h-px w-full bg-border" />
                  <ul className="space-y-3 text-sm text-night">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-success" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {plan.note && <p className="mt-4 text-sm italic text-slate">{plan.note}</p>}
                  <div className="mt-6">
                    <CheckoutButton
                      label={plan.priceKey === "subscription" ? "Démarrer mon abonnement" : "Acheter maintenant"}
                      priceKey={plan.priceKey}
                      variant={plan.priceKey === "subscription" ? "outline" : "primary"}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center text-sm text-slate">
              <p>
                Pas sûr ? <a href="#audit" className="text-accent">Commencez par l'audit gratuit →</a>
              </p>
              <p className="mt-2">
                Des questions ? <Link href={calendlyUrl} className="text-accent" target="_blank">Réservez un appel gratuit</Link>
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section bg-surface" id="social-proof">
        <div className="mx-auto max-w-6xl px-6">
          <FadeIn>
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((item, index) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border border-border bg-white p-6 shadow-sm md:${index === 0 ? "-rotate-1" : index === 2 ? "rotate-1" : "rotate-0"}`}
                >
                  <Quote className="h-12 w-12 text-[#EEF2FF]" />
                  <p className="mt-4 text-base italic text-night">“{item.quote}”</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">{item.delta}</span>
                    <p className="text-sm text-slate">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" id="faq">
        <div className="mx-auto max-w-3xl px-6">
          <FadeIn>
            {faq.map((item) => (
              <details key={item.question} className="border-b border-border py-4">
                <summary className="flex cursor-pointer items-center justify-between text-base font-semibold text-night">
                  {item.question}
                  <span className="text-accent">+</span>
                </summary>
                <p className="mt-3 text-sm text-slate">{item.answer}</p>
              </details>
            ))}
          </FadeIn>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="section">
        <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-[#4F46E5] to-accent p-12 text-center text-white">
          <FadeIn>
            <h2 className="text-4xl font-semibold">Si vous avez un site, vous méritez d'être visible partout — y compris sur les IA.</h2>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a href="#audit" className="rounded-xl bg-white px-6 py-4 text-base font-semibold text-accent">
                Je veux mon score maintenant
              </a>
              <a href="#pricing" className="rounded-xl border border-white px-6 py-4 text-base font-semibold text-white">
                Voir les offres
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-night py-10 text-sm text-[#94A3B8]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-base font-semibold text-white">Agentable</p>
            <p>Jungle.Block Solutions · SIRET 99521609000010 · Service 100% français 🇫🇷</p>
            <p>© 2025 Agentable — Tous droits réservés</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/mentions-legales" className="text-white/80">
              Mentions légales
            </Link>
            <a href="mailto:contact@agentable.fr" className="text-white/80">
              Contact
            </a>
            <Link href={calendlyUrl} className="text-white/80" target="_blank">
              Besoin d'aide ? Parlons-en
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
