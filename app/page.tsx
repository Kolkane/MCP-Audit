import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  CreditCard,
  EyeOff,
  FileText,
  FileX,
  Link as LinkIcon,
  Quote,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Stethoscope,
  TrendingDown,
  User,
  Wrench,
  Zap,
  X
} from "lucide-react";
import { FadeIn } from "@/components/fade-in";
import { ScoreAnimation } from "@/components/score-animation";
import { AuditForm } from "@/components/audit-form";
import { Navbar } from "@/components/navbar";
import { HeroAnalyzer } from "@/components/hero-analyzer";
import { PricingPlans } from "@/components/pricing-plans";

const problemPoints = [
  {
    title: "Invisible sur ChatGPT",
    description: "Un client demande un prestataire → vos concurrents sortent, vous non.",
    icon: EyeOff
  },
  {
    title: "Données illisibles",
    description: "Les agents IA ne comprennent pas vos services ni vos offres.",
    icon: FileX
  },
  {
    title: "Parts de marché perdues",
    description: "Chaque requête IA devient un lead confié à quelqu'un d'autre.",
    icon: TrendingDown
  }
];

const steps = [
  {
    title: "Entrez votre URL",
    description: "Notre agent analyse votre site en 60 secondes",
    icon: LinkIcon,
    number: "01"
  },
  {
    title: "Recevez votre score",
    description: "Score + lacunes + prix personnalisé affichés instantanément. Rapport complet par email.",
    icon: FileText,
    number: "02"
  },
  {
    title: "Choisissez votre formule",
    description: "One-shot ou abonnement — prix calculé selon votre site",
    icon: CreditCard,
    number: "03"
  },
  {
    title: "Conformité automatique",
    description: "Notre agent optimise votre visibilité IA sous 48h",
    icon: Zap,
    number: "04"
  }
];

const personas = [
  { label: "Freelances", benefit: "Sois recommandé avant tes concurrents", icon: User },
  { label: "Agences", benefit: "Proposez l'audit en offre additionnelle", icon: Building2 },
  { label: "PME-TPE", benefit: "Capturez les clients IA", icon: Briefcase },
  { label: "Artisans", benefit: "Soyez trouvés même sans SEO avancé", icon: Wrench },
  { label: "Professions libérales", benefit: "Patients et clients vous trouvent", icon: Stethoscope },
  { label: "E-commerce", benefit: "Vos produits lus par les agents IA", icon: ShoppingBag }
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
    answer: "48h après paiement de l'activation. Tu reçois le rapport final avec la nouvelle note garantie >80/100."
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
      <section
        id="hero"
        className="hero-texture relative pt-32"
        style={{ background: "linear-gradient(180deg, #EEF2FF 0%, #F5F7FF 60%, #FFFFFF 100%)" }}
      >
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
                Entrez votre URL ci-dessous — notre agent analyse votre visibilité IA en 60 secondes, gratuitement.
              </p>
              <HeroAnalyzer />
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
      <section className="section bg-white" id="problem">
        <div className="mx-auto max-w-6xl px-6">
          <FadeIn>
            <div className="grid gap-6 md:grid-cols-3">
              {problemPoints.map((point, index) => {
                const Icon = point.icon;
                return (
                  <div key={point.title} className="relative overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-sm">
                    <span className="absolute right-4 top-4 text-6xl font-bold text-surface">0{index + 1}</span>
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-6 text-lg font-semibold text-night">{point.title}</h3>
                    <p className="mt-2 text-sm text-slate">{point.description}</p>
                  </div>
                );
              })}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* PROCESS */}
      <section className="section" id="process">
        <div className="mx-auto max-w-3xl px-6">
          <FadeIn>
            <h2 className="text-3xl font-semibold text-center">Comment ça marche</h2>
            <div className="relative mt-10">
              <div className="absolute left-[15px] top-4 bottom-4 border-l-2 border-dashed border-indigo-200" />
              <div className="space-y-8">
                {steps.map((step, index) => (
                  <div key={step.number} className="relative pl-12">
                    <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#4F46E5] text-xs font-bold text-white">
                      {step.number}
                    </div>
                    <h3 className="text-sm font-semibold text-night">{step.title}</h3>
                    <p className="mt-1 text-xs text-slate">{step.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-center text-indigo-400">↓</div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* REPORT */}
      <section className="section" id="report">
        <div className="mx-auto max-w-5xl px-6">
          <FadeIn>
            <div className="flex flex-col gap-12 md:flex-row md:items-center">
              <div className="flex-1 space-y-4">
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-accent">Exemple de rapport</span>
                <h3 className="text-3xl font-bold text-night leading-tight">Voici ce que vous recevez en 60 secondes</h3>
                <p className="text-base text-slate">
                  Notre agent analyse votre site en temps réel et génère un rapport personnalisé avec :
                </p>
                <ul className="space-y-2 text-sm text-night">
                  {[
                    "Score global /100 avec détail par critère",
                    "Identification de toutes vos lacunes",
                    "Estimation de la valeur business perdue",
                    "Prix d'activation calculé sur mesure"
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-accent">
                      <Check className="h-4 w-4" />
                      <span className="text-night">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-3">
                  <p className="text-sm font-semibold text-night">Et par email sous 24h :</p>
                  <ul className="mt-2 space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-accent">
                      <Check className="h-4 w-4" />
                      <span className="text-night">Rapport PDF complet 6 pages</span>
                    </li>
                    <li className="flex items-center gap-2 text-accent">
                      <Check className="h-4 w-4" />
                      <span className="text-night">Instructions d'implémentation pas à pas</span>
                    </li>
                  </ul>
                </div>
                <a
                  href="#hero"
                  className="inline-flex items-center justify-center rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-white"
                >
                  Analyser mon site gratuitement →
                </a>
                <p className="text-xs text-slate">⚡ Résultat en 60 secondes · 100% gratuit</p>
              </div>
              <div className="flex-1">
                <div className="relative rotate-1">
                  <div className="absolute inset-0 -rotate-3 scale-95 rounded-3xl bg-indigo-100 opacity-70"></div>
                  <div className="relative overflow-hidden rounded-3xl bg-white text-night shadow-[0_20px_60px_rgba(99,102,241,0.15)]">
                    <div className="flex items-center justify-between bg-gradient-to-br from-[#4F46E5] to-accent p-6 text-white">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-white/70">Rapport Agentable — Exemple</p>
                        <p className="text-lg font-bold">monsite-exemple.fr</p>
                      </div>
                      <ShieldCheck className="h-8 w-8 text-white/50" />
                    </div>
                    <div className="p-6">
                      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative h-[120px] w-[120px]">
                            <svg width="120" height="120">
                              <circle cx="60" cy="60" r="52" stroke="#F1F5F9" strokeWidth="8" fill="none" />
                              <circle
                                cx="60"
                                cy="60"
                                r="52"
                                stroke="#EF4444"
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={2 * Math.PI * 52}
                                strokeDashoffset={2 * Math.PI * 52 - (34/100) * 2 * Math.PI * 52}
                                strokeLinecap="round"
                                transform="rotate(-90 60 60)"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-3xl font-black text-night">34</span>
                              <span className="text-sm text-slate">/100</span>
                            </div>
                          </div>
                          <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600">⚠ Score critique</span>
                        </div>
                        <p className="max-w-xs text-sm text-slate">Votre site est quasi-invisible pour les agents IA.</p>
                      </div>
                      <div className="my-6 h-px w-full border-t border-[#F1F5F9]" />
                      <div className="space-y-3">
                        {[
                          { label: "Schema.org", score: 8 },
                          { label: "Données NAP", score: 12 },
                          { label: "Métadonnées", score: 6 },
                          { label: "FAQ structurée", score: 4 },
                          { label: "Vitesse page", score: 15 },
                          { label: "Citations externes", score: 5 }
                        ].map((item) => (
                          <div key={item.label} className="flex items-center gap-4 border-b border-[#F8F9FF] pb-2">
                            <div className="w-32 text-sm font-semibold text-night">{item.label}</div>
                            <div className="h-2 w-[160px] rounded-full bg-[#F1F5F9]">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${(item.score / 20) * 100}%`,
                                  background:
                                    item.score >= 14 ? "#22C55E" : item.score >= 9 ? "#F97316" : "#EF4444"
                                }}
                              />
                            </div>
                            <div className="w-16 text-right text-xs text-slate">{item.score}/20</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6">
                        <p className="text-sm font-semibold text-night">Problèmes critiques détectés :</p>
                        <ul className="mt-2 space-y-2 text-sm text-night">
                          {[
                            "Vos données schema.org sont absentes",
                            "Les agents IA ne retrouvent pas vos coordonnées",
                            "Meta description introuvable pour ChatGPT"
                          ].map((issue) => (
                            <li key={issue} className="flex items-start gap-2 text-danger">
                              <X className="h-4 w-4" />
                              <span className="text-night">{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                        <div className="flex items-center justify-between">
                          <span>💸 Valeur business perdue estimée</span>
                          <span className="text-lg font-bold">2 400€/mois</span>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-col gap-3 rounded-xl bg-[#F8F9FF] px-4 py-3 text-sm text-slate md:flex-row md:items-center md:justify-between">
                        <span>Prix d'activation estimé : 349€ HT</span>
                        <a href="#pricing" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white">
                          Corriger mon score →
                        </a>
                      </div>
                    </div>
                  </div>
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
            <div className="text-center">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
                Pour qui ?
              </span>
              <h2 className="mt-3 text-3xl font-bold text-night">Une solution pour chaque structure</h2>
              <p className="mx-auto mt-2 max-w-xl text-base text-slate">
                Peu importe votre secteur ou votre taille — si vous avez un site, vous perdez des clients sur les IA chaque jour.
              </p>
            </div>
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

      {/* REPORT EMAIL */}
      <section className="section" id="report-email">
        <div className="mx-auto max-w-4xl rounded-3xl border border-[#E2E8F0] bg-white p-10 text-center shadow-[0_20px_60px_rgba(99,102,241,0.12)]">
          <FadeIn>
            <h2 className="text-3xl font-semibold text-night">Vous préférez un rapport complet ?</h2>
            <p className="mt-3 text-base text-slate">Laissez votre email — nous vous envoyons l'analyse complète sous 24h.</p>
            <div className="mt-8 flex flex-col gap-4 md:flex-row">
              <input
                type="email"
                placeholder="prenom@entreprise.com"
                className="flex-1 rounded-xl border border-border px-4 py-3 text-night focus:border-accent focus:outline-none"
              />
              <button className="rounded-xl bg-accent px-6 py-3 text-base font-semibold text-white">Recevoir le rapport complet →</button>
            </div>
            <p className="mt-3 text-sm text-slate">✓ Gratuit · ✓ 24h · ✓ RGPD</p>
          </FadeIn>
        </div>
      </section>

      {/* PRICING */}
      <section className="section" id="pricing">
        <div className="mx-auto max-w-6xl px-6">
          <FadeIn>
            <div className="text-center">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-accent">Tarifs</span>
              <h2 className="mt-3 text-3xl font-bold text-night">Simple. Transparent. Personnalisé.</h2>
              <p className="mx-auto mt-2 max-w-lg text-base text-slate">
                Votre prix d'activation est calculé automatiquement selon votre score. Entrez votre URL pour le connaître.
              </p>
            </div>
            <PricingPlans calendlyUrl={calendlyUrl} />
            <div className="mt-8 text-center text-sm text-slate">
              <p>
                Pas sûr ? <a href="#hero" className="text-accent">Commencez par l'analyse gratuite →</a>
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
                  className={`rounded-2xl border border-border bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] md:${index === 0 ? "-rotate-1" : index === 2 ? "rotate-1" : "rotate-0"}`}
                >
                  <div className="text-6xl font-serif leading-none text-indigo-100">“</div>
                  <p className="mt-2 text-base font-medium italic text-night">{item.quote}</p>
                  <div className="my-4 h-px w-full border-t border-[#F1F5F9]" />
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-bold text-green-700">
                      {item.delta} ↑
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-night">{item.label.split(" — ")[0]}</p>
                      <p className="text-xs text-slate">{item.label.split(" — ")[1]}</p>
                    </div>
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
              <details key={item.question} className="group border-b border-[#F1F5F9] py-5">
                <summary className="flex cursor-pointer items-center justify-between text-base font-semibold text-night transition hover:text-accent">
                  {item.question}
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EEF2FF] text-sm font-bold text-indigo-500 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pb-4 pt-3 text-sm leading-relaxed text-slate">{item.answer}</p>
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
              <a
                href="#hero"
                className="rounded-xl bg-white px-6 py-4 text-base font-semibold text-[#4F46E5] shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition hover:bg-indigo-50"
              >
                Je veux mon score maintenant
              </a>
              <a
                href="#pricing"
                className="rounded-xl border-2 border-white/60 px-6 py-4 text-base font-semibold text-white transition hover:border-white hover:bg-white/10"
              >
                Voir les offres
              </a>
            </div>
            <p className="mt-4 text-sm text-white/70">✓ Sans engagement · ✓ Résultats en 48h · ✓ 100% automatique</p>
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
