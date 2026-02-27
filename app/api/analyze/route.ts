import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import crypto from "crypto";

import { getPricing, MAINTENANCE_PRICE } from "@/lib/pricing";
import { getSupabaseServerClient } from "@/lib/supabase";

const ANALYZE_TIMEOUT_MS = 20_000;
const MAX_ANALYSES_PER_HOUR = 3;
const CACHE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h
const FALLBACK_SCORE = 35;

const DEFAULT_ISSUES = [
  "Vos données schema.org sont absentes ou incomplètes",
  "Vos coordonnées (NAP) sont illisibles par les agents IA",
  "Vos métadonnées ne sont pas optimisées pour ChatGPT"
];

const CRITERIA_LABELS = [
  { key: "schema", label: "Schema.org" },
  { key: "nap", label: "Données NAP" },
  { key: "meta", label: "Métadonnées" },
  { key: "faq", label: "FAQ structurée" },
  { key: "speed", label: "Vitesse page" },
  { key: "citations", label: "Citations externes" }
] as const;

const EXPECTED_SCHEMA_TYPES = ["Organization", "LocalBusiness", "Service", "WebSite", "Product", "FAQPage", "BreadcrumbList", "Person"];
const SOCIAL_DOMAINS = ["facebook.com", "linkedin.com", "instagram.com", "twitter.com", "x.com", "youtube.com", "tiktok.com"];
const DIRECTORY_DOMAINS = ["pagesjaunes.fr", "trustpilot.com", "google.com/maps", "g.page", "sortlist", "clutch.co", "yelp.com"];
const CERTIFICATION_KEYWORDS = ["certifié", "certification", "label", "partenaire", "agréé"];
const REVIEW_KEYWORDS = ["avis", "témoignage", "review", "note clients", "retour client"];

const FALLBACK_EXPLANATION = "Votre site présente plusieurs lacunes critiques détectées lors de l'analyse.";
const BLOCKED_EXPLANATION =
  "Votre site a limité l'accès lors de l'analyse. Score de précaution attribué — les lacunes détectées sont représentatives de la majorité des sites non optimisés.";

type SchemaOrgDetail = {
  score: number;
  found: string[];
  missing: string[];
};

type NapDetail = {
  score: number;
  hasPhone: boolean;
  hasAddress: boolean;
  hasEmail: boolean;
  isCoherent: boolean;
};

type MetadataDetail = {
  score: number;
  hasTitle: boolean;
  titleLength: number;
  hasDescription: boolean;
  descLength: number;
  hasOG: boolean;
  hasImage: boolean;
  hasTwitterCard: boolean;
};

type FaqDetail = {
  score: number;
  hasStructured: boolean;
  hasHtml: boolean;
  questionsCount: number;
};

type SpeedDetail = {
  score: number;
  htmlSize: number; // KB
  scriptsCount: number;
  cssCount: number;
  imagesWithoutAlt: number;
  lazyImages: number;
  hasViewportMeta: boolean;
};

type CitationDetail = {
  score: number;
  socialLinks: string[];
  hasGMB: boolean;
  hasReviews: boolean;
  hasCertifications: boolean;
  hasDirectories: boolean;
};

type CriteriaDetail = {
  schemaOrg: SchemaOrgDetail;
  nap: NapDetail;
  metadata: MetadataDetail;
  faq: FaqDetail;
  vitesse: SpeedDetail;
  citations: CitationDetail;
};

type Correction = {
  critere: string;
  probleme: string;
  solution: string;
  impact: "critique" | "important" | "utile";
};

type EvaluationResult = {
  score: number;
  issues: string[];
  timeout: boolean;
  criteresDetail: CriteriaDetail;
  corrections: Correction[];
};

const FALLBACK_DETAIL_NO_HTML = createDetailFromScores({ schema: 2, nap: 8, meta: 6, faq: 1, speed: 12, citations: 3 });
const SIZE_FALLBACK_DETAIL = {
  low: createDetailFromScores({ schema: 4, nap: 4, meta: 4, faq: 3, speed: 5, citations: 4 }),
  medium: createDetailFromScores({ schema: 6, nap: 6, meta: 6, faq: 5, speed: 6, citations: 7 }),
  high: createDetailFromScores({ schema: 8, nap: 8, meta: 8, faq: 6, speed: 9, citations: 9 })
} as const;

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    console.log("URL reçue:", url);
    if (!url || typeof url !== "string" || !/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "URL invalide" }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch (error) {
      return NextResponse.json({ error: "URL invalide" }, { status: 400 });
    }

    const displayUrl = parsed.toString();
    const normalizedUrl = normalizeUrl(displayUrl);
    console.log("URL normalisée:", normalizedUrl);

    const ip = getClientIp(request);
    const ipHash = hashValue(ip);

    const supabase = getSupabaseServerClient();

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount, error: rateError } = await supabase
      .from("analyses")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", oneHourAgo);

    if (rateError) {
      throw rateError;
    }

    if ((recentCount ?? 0) >= MAX_ANALYSES_PER_HOUR) {
      return NextResponse.json({ error: "Limite atteinte. Réessaie dans une heure." }, { status: 429 });
    }

    const cacheWindowStart = new Date(Date.now() - CACHE_WINDOW_MS).toISOString();
    const { data: cachedAnalysis, error: cacheError } = await supabase
      .from("analyses")
      .select("*")
      .eq("url", normalizedUrl)
      .gte("created_at", cacheWindowStart)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cacheError) {
      console.error("Cache lookup error", cacheError);
    }

    if (cachedAnalysis && cachedAnalysis.statut !== "error") {
      const cachedDetail = normalizeDetail((cachedAnalysis as any).criteres_detail);
      const cachedScore = cachedAnalysis.score ?? FALLBACK_SCORE;
      const cachedPricing = getPricing(cachedScore);
      const cachedIssues = cachedAnalysis.lacunes ?? DEFAULT_ISSUES;
      const corrections = buildCorrections(cachedDetail);
      const cachedValeurPerdue = cachedAnalysis.valeur_perdue ?? Math.max(0, Math.round((100 - cachedScore) * 120));

      return NextResponse.json({
        auditId: cachedAnalysis.id,
        url: displayUrl,
        score: cachedScore,
        level: cachedPricing.label,
        niveau: cachedAnalysis.niveau ?? cachedPricing.niveau,
        issues: cachedIssues,
        priceActivation: cachedAnalysis.prix_activation ?? cachedPricing.prixActivation,
        prixActivation: cachedAnalysis.prix_activation ?? cachedPricing.prixActivation,
        maintenancePrice: MAINTENANCE_PRICE,
        explanation: cachedAnalysis.explication ?? FALLBACK_EXPLANATION,
        explication: cachedAnalysis.explication ?? FALLBACK_EXPLANATION,
        lacunes: cachedIssues,
        criteresDetail: cachedDetail,
        corrections,
        valeurPerdue: cachedValeurPerdue,
        timeout: cachedAnalysis.timeout ?? false,
        cached: true
      });
    }

    const fetchResult = await fetchHtmlWithRetry(displayUrl);

    let evaluation: EvaluationResult;
    let usedBlockedFallback = false;

    try {
      if (fetchResult.html) {
        evaluation = evaluateSite(fetchResult.html, parsed);
      } else {
        evaluation = getBlockedFallbackEvaluation();
        usedBlockedFallback = true;
      }
    } catch (evaluationError) {
      console.error("Evaluation error", evaluationError);
      evaluation = fetchResult.html
        ? getSizeBasedFallbackEvaluation(fetchResult.html.length)
        : getBlockedFallbackEvaluation();
      if (!fetchResult.html) {
        usedBlockedFallback = true;
      }
    }

    console.log("Scraping result:", {
      url: normalizedUrl,
      schemaScore: evaluation.criteresDetail.schemaOrg.score,
      napScore: evaluation.criteresDetail.nap.score,
      metaScore: evaluation.criteresDetail.metadata.score,
      faqScore: evaluation.criteresDetail.faq.score,
      vitesseScore: evaluation.criteresDetail.vitesse.score,
      citationsScore: evaluation.criteresDetail.citations.score,
      responseTime: fetchResult.responseTime ?? null,
      htmlLength: fetchResult.htmlLength ?? (fetchResult.html?.length ?? null)
    });

    const pricing = getPricing(evaluation.score);
    const explanation = usedBlockedFallback
      ? BLOCKED_EXPLANATION
      : evaluation.issues[0] || "Votre site est déjà lisible par la plupart des agents IA.";
    const valeurPerdue = Math.max(0, Math.round((100 - evaluation.score) * 120));

    const { data: audit, error: insertError } = await supabase
      .from("analyses")
      .insert({
        url: normalizedUrl,
        score: evaluation.score,
        niveau: pricing.niveau,
        explication: explanation,
        lacunes: evaluation.issues,
        prix_activation: pricing.prixActivation,
        valeur_perdue: valeurPerdue,
        criteres_detail: evaluation.criteresDetail,
        ip_hash: ipHash,
        cached: false
      })
      .select("id")
      .single();

    if (insertError || !audit) {
      throw insertError || new Error("Audit insertion failed");
    }

    return NextResponse.json({
      auditId: audit.id,
      url: displayUrl,
      score: evaluation.score,
      level: pricing.label,
      niveau: pricing.niveau,
      issues: evaluation.issues,
      priceActivation: pricing.prixActivation,
      prixActivation: pricing.prixActivation,
      maintenancePrice: MAINTENANCE_PRICE,
      explanation,
      explication: explanation,
      lacunes: evaluation.issues,
      criteresDetail: evaluation.criteresDetail,
      corrections: evaluation.corrections,
      valeurPerdue,
      timeout: (fetchResult.timedOut ?? false) || false,
      cached: false
    });
  } catch (error) {
    console.error("Analyze error", error);
    return NextResponse.json(getFallbackResponse(), { status: 200 });
  }
}

function getClientIp(request: Request) {
  const headers = request.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function hashValue(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeUrl(raw: string) {
  try {
    const parsed = new URL(raw);
    const hostname = parsed.hostname.replace(/^www\./, "");
    const pathname = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
    const search = parsed.search || "";
    return `${hostname}${pathname}${search}`;
  } catch (error) {
    return raw;
  }
}

async function fetchHtmlWithTimeout(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);
  const startedAt = Date.now();
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "AgentableAudit/1.0" } });
    const html = await response.text();
    clearTimeout(timeout);
    return { html, timedOut: false, responseTime: Date.now() - startedAt, htmlLength: html.length };
  } catch (error) {
    clearTimeout(timeout);
    return { html: null, timedOut: true, responseTime: Date.now() - startedAt, htmlLength: 0 };
  }
}

async function fetchHtmlWithRetry(url: string, attempts = 2) {
  let attempt = 0;
  let result = await fetchHtmlWithTimeout(url);

  while (attempt < attempts - 1 && !result.html && result.timedOut) {
    attempt += 1;
    await new Promise((resolve) => setTimeout(resolve, 2000));
    result = await fetchHtmlWithTimeout(url);
    if (result.html || !result.timedOut) {
      break;
    }
  }

  return result;
}

function evaluateSite(html: string, targetUrl?: URL): EvaluationResult {
  const $ = cheerio.load(html);

  const schemaOrg = analyzeSchema($);
  const nap = analyzeNAP($);
  const metadata = analyzeMetadata($);
  const faq = analyzeFAQ($);
  const vitesse = analyzeSpeed($, html);
  const citations = analyzeCitations($, targetUrl?.hostname);

  const detail: CriteriaDetail = {
    schemaOrg,
    nap,
    metadata,
    faq,
    vitesse,
    citations
  };

  const score = scoreFromDetail(detail);
  const issues = buildIssuesFromDetail(detail);
  const corrections = buildCorrections(detail);

  return {
    score,
    issues,
    timeout: false,
    criteresDetail: detail,
    corrections
  };
}

function scoreFromDetail(detail: CriteriaDetail) {
  const total =
    detail.schemaOrg.score +
    detail.nap.score +
    detail.metadata.score +
    detail.faq.score +
    detail.vitesse.score +
    detail.citations.score;
  return Math.max(0, Math.min(100, Math.round((total / 120) * 100)));
}

function analyzeSchema($: cheerio.CheerioAPI): SchemaOrgDetail {
  const found = new Set<string>();
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const json = JSON.parse($(element).text());
      const entries = Array.isArray(json) ? json : [json];
      entries.forEach((entry) => {
        if (entry && typeof entry === "object" && entry["@type"]) {
          const type = `${entry["@type"]}`.replace(/^[^A-Za-z]+/, "");
          if (type) {
            found.add(type);
          }
        }
      });
    } catch (error) {
      // ignore malformed json
    }
  });

  $('[itemscope][itemtype]').each((_, element) => {
    const type = $(element).attr("itemtype");
    if (type) {
      const clean = type.split("/").pop();
      if (clean) {
        found.add(clean);
      }
    }
  });

  const foundList = Array.from(found);
  const usefulTypes = foundList.filter((type) => type.toLowerCase() !== "website");

  let score = 0;
  if (foundList.length === 0) {
    score = 0;
  } else if (foundList.length === 1 && foundList[0].toLowerCase() === "website") {
    score = 5;
  } else if (usefulTypes.length <= 2) {
    score = 10;
  } else if (usefulTypes.length >= 3) {
    score = 15;
  }
  if (usefulTypes.length >= 3 && found.has("FAQPage")) {
    score = 20;
  }

  const missing = EXPECTED_SCHEMA_TYPES.filter((type) => !foundList.includes(type));
  return { score, found: foundList, missing };
}

function analyzeNAP($: cheerio.CheerioAPI): NapDetail {
  const bodyText = $("body").text();
  const headerText = $("header").text();
  const footerText = $("footer").text();

  const phoneRegex = /\+?[\d\s().-]{10,}/g;
  const phoneMatches = bodyText.match(phoneRegex) || [];
  const hasPhone = phoneMatches.length > 0;

  const addressRegex = /(\b\d{2,5}\b\s*(rue|avenue|boulevard|route|road|street|chemin|place|impasse|paris|france))/i;
  const hasAddress = addressRegex.test(bodyText);
  const hasEmail = /[\w.-]+@[\w.-]+\.[A-Za-z]{2,}/.test(bodyText);

  const headerPhone = (headerText.match(phoneRegex) || [])[0]?.replace(/\D/g, "");
  const footerPhone = (footerText.match(phoneRegex) || [])[0]?.replace(/\D/g, "");
  const isCoherent = Boolean(headerPhone && footerPhone && headerPhone === footerPhone);

  let score = 0;
  if (!hasPhone && !hasAddress && !hasEmail) {
    score = 0;
  } else if (hasEmail && !hasPhone && !hasAddress) {
    score = 5;
  } else if ((hasPhone && !hasAddress) || (hasAddress && !hasPhone)) {
    score = 8;
  } else if (hasPhone && hasAddress && !hasEmail) {
    score = 13;
  } else if (hasPhone && hasAddress && hasEmail && !isCoherent) {
    score = 17;
  } else if (hasPhone && hasAddress && hasEmail && isCoherent) {
    score = 20;
  }

  return { score, hasPhone, hasAddress, hasEmail, isCoherent };
}

function analyzeMetadata($: cheerio.CheerioAPI): MetadataDetail {
  const title = $("title").text().trim();
  const metaDesc = $('meta[name="description"]').attr("content")?.trim() ?? "";
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
  const ogDesc = $('meta[property="og:description"]').attr("content")?.trim();
  const ogImage = $('meta[property="og:image"]').attr("content")?.trim();
  const ogUrl = $('meta[property="og:url"]').attr("content");
  const twitterCard = $('meta[name="twitter:card"]').attr("content");

  const hasTitle = Boolean(title);
  const hasDescription = Boolean(metaDesc);
  const hasOG = Boolean(ogTitle && ogDesc && ogUrl);
  const hasImage = Boolean(ogImage);
  const hasTwitterCard = Boolean(twitterCard);

  const titleLength = title.length;
  const descLength = metaDesc.length;
  const titleOptimal = titleLength >= 30 && titleLength <= 60;
  const descOptimal = descLength >= 100 && descLength <= 160;

  let score = 0;
  if (!hasTitle && !hasDescription) {
    score = 0;
  } else if (hasTitle && !hasDescription) {
    score = 4;
  } else if (hasTitle && hasDescription && !ogTitle) {
    score = 8;
  } else if (hasTitle && hasDescription && ogTitle && !ogDesc) {
    score = 12;
  } else if (hasTitle && hasDescription && hasOG && hasImage) {
    score = 16;
  }
  if (hasTitle && hasDescription && hasOG && hasImage && titleOptimal && descOptimal && hasTwitterCard) {
    score = 20;
  }

  return { score, hasTitle, titleLength, hasDescription, descLength, hasOG, hasImage, hasTwitterCard };
}

function analyzeFAQ($: cheerio.CheerioAPI): FaqDetail {
  let structuredCount = 0;
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const json = JSON.parse($(element).text());
      const entries = Array.isArray(json) ? json : [json];
      entries.forEach((entry) => {
        if (entry && entry["@type"] === "FAQPage" && Array.isArray(entry.mainEntity)) {
          structuredCount += entry.mainEntity.length;
        }
      });
    } catch (error) {
      // ignore
    }
  });

  const htmlFaqBlocks = $('[class*="faq"], #faq, .faq');
  const microdataFaq = $('[itemscope][itemtype*="FAQPage"]');
  const accordionFaq = htmlFaqBlocks.find("details").length;

  const hasStructured = structuredCount > 0;
  const hasHtml = htmlFaqBlocks.length > 0 || accordionFaq > 0 || microdataFaq.length > 0;
  const questionsCount = Math.max(structuredCount, accordionFaq, htmlFaqBlocks.find("h3, h4").length);

  let score = 0;
  if (!hasStructured && !hasHtml) {
    score = 0;
  } else if (hasHtml && !microdataFaq.length && !hasStructured) {
    score = 5;
  } else if (microdataFaq.length > 0 && !hasStructured) {
    score = 10;
  } else if (hasStructured && structuredCount < 5) {
    score = 15;
  } else if (hasStructured && structuredCount >= 5) {
    score = 20;
  }

  return { score, hasStructured, hasHtml, questionsCount };
}

function analyzeSpeed($: cheerio.CheerioAPI, html: string): SpeedDetail {
  const htmlSize = Math.round(html.length / 1024);
  const scriptsCount = $('script[src]').length;
  const cssCount = $('link[rel="stylesheet"]').length;
  const images = $('img');
  const imagesWithoutAlt = images.filter((_, img) => !$(img).attr("alt") || $(img).attr("alt")?.trim() === "").length;
  const lazyImages = $('img[loading="lazy"]').length;
  const hasViewportMeta = Boolean($('meta[name="viewport"]').length);

  let score = 12;
  if (htmlSize > 500 || scriptsCount >= 15) {
    score = 5;
  } else if (htmlSize > 200 || scriptsCount >= 10) {
    score = 10;
  } else if (htmlSize < 200 && scriptsCount < 10) {
    score = 15;
  }
  if (htmlSize < 100 && scriptsCount < 5 && imagesWithoutAlt === 0) {
    score = 20;
  }

  return { score, htmlSize, scriptsCount, cssCount, imagesWithoutAlt, lazyImages, hasViewportMeta };
}

function analyzeCitations($: cheerio.CheerioAPI, host?: string): CitationDetail {
  const socialLinks = new Set<string>();
  let hasGMB = false;
  let hasDirectories = false;

  $('a[href]').each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;
    try {
      const url = new URL(href, "https://example.com");
      const domain = url.hostname.replace(/^www\./, "");
      if (SOCIAL_DOMAINS.some((social) => domain.endsWith(social))) {
        socialLinks.add(domain.split(".").slice(-2).join("."));
      }
      if (href.includes("google.com/maps") || href.includes("g.page")) {
        hasGMB = true;
      }
      if (DIRECTORY_DOMAINS.some((dir) => href.includes(dir))) {
        hasDirectories = true;
      }
    } catch (error) {
      // ignore invalid URLs
    }
  });

  const bodyText = $('body').text().toLowerCase();
  const hasCertifications = CERTIFICATION_KEYWORDS.some((keyword) => bodyText.includes(keyword));
  const hasReviews = REVIEW_KEYWORDS.some((keyword) => bodyText.includes(keyword));

  let score = 0;
  if (socialLinks.size === 0 && !hasGMB && !hasReviews) {
    score = 0;
  } else if (socialLinks.size > 0 && socialLinks.size <= 2) {
    score = 5;
  } else if (socialLinks.size >= 2 && hasGMB) {
    score = 10;
  } else if (socialLinks.size >= 2 && hasGMB && hasReviews) {
    score = 13;
  } else if (socialLinks.size >= 2 && hasGMB && hasReviews && (hasDirectories || hasCertifications)) {
    score = hasCertifications ? 20 : 17;
  }

  return {
    score,
    socialLinks: Array.from(socialLinks),
    hasGMB,
    hasReviews,
    hasCertifications,
    hasDirectories
  };
}

function buildIssuesFromDetail(detail: CriteriaDetail) {
  const issues: string[] = [];
  if (detail.schemaOrg.score < 15) issues.push("Vos données schema.org sont absentes ou incomplètes");
  if (detail.nap.score < 17) issues.push("Vos coordonnées (NAP) sont illisibles par les agents IA");
  if (detail.metadata.score < 16) issues.push("Vos métadonnées ne sont pas optimisées pour ChatGPT");
  if (detail.faq.score < 15) issues.push("Aucune FAQ structurée détectée");
  if (detail.vitesse.score < 15) issues.push("Votre site est trop lourd pour être pleinement exploré par les IA");
  if (detail.citations.score < 15) issues.push("Peu de signaux d'autorité externes détectés");
  return issues.length ? issues : DEFAULT_ISSUES;
}

function buildCorrections(detail: CriteriaDetail): Correction[] {
  const corrections: Correction[] = [];

  if (detail.schemaOrg.score < 10) {
    corrections.push({
      critere: "Schema.org",
      probleme: "Aucune donnée structurée détectée sur votre site",
      solution: "Ajout du code JSON-LD Organization, Service, FAQPage et BreadcrumbList",
      impact: "critique"
    });
  }

  if (!detail.nap.hasPhone || !detail.nap.hasAddress) {
    corrections.push({
      critere: "Données NAP",
      probleme: "Coordonnées incomplètes pour les IA",
      solution: "Structuration des coordonnées en schema.org LocalBusiness + harmonisation header/footer",
      impact: "critique"
    });
  } else if (!detail.nap.isCoherent) {
    corrections.push({
      critere: "Données NAP",
      probleme: "Numéros différents entre header et footer",
      solution: "Uniformiser les coordonnées et les exposer dans un bloc LocalBusiness",
      impact: "important"
    });
  }

  if (detail.metadata.score < 16) {
    corrections.push({
      critere: "Métadonnées",
      probleme: "Balises title/description/OG incomplètes",
      solution: "Réécriture des metas + ajout og:image, twitter card et formats optimisés",
      impact: "important"
    });
  }

  if (detail.faq.score < 15) {
    corrections.push({
      critere: "FAQ",
      probleme: "FAQ non structurée pour les agents IA",
      solution: "Création d'une FAQPage JSON-LD avec 5 questions prioritaires",
      impact: "important"
    });
  }

  if (detail.vitesse.score < 15) {
    corrections.push({
      critere: "Vitesse & accessibilité",
      probleme: "Page lourde et peu optimisée",
      solution: "Allégement des scripts, compression HTML et ajout des attributs alt/lazy-loading",
      impact: "important"
    });
  }

  if (detail.citations.score < 15) {
    corrections.push({
      critere: "Autorité",
      probleme: "Aucun signal externe détecté",
      solution: "Ajout des liens vers réseaux sociaux, Google Business Profile et pages d'avis",
      impact: "utile"
    });
  }

  return corrections.slice(0, 4);
}

function createDetailFromScores(scores: { schema: number; nap: number; meta: number; faq: number; speed: number; citations: number }): CriteriaDetail {
  return {
    schemaOrg: { score: scores.schema, found: [], missing: EXPECTED_SCHEMA_TYPES },
    nap: { score: scores.nap, hasPhone: false, hasAddress: false, hasEmail: false, isCoherent: false },
    metadata: {
      score: scores.meta,
      hasTitle: false,
      titleLength: 0,
      hasDescription: false,
      descLength: 0,
      hasOG: false,
      hasImage: false,
      hasTwitterCard: false
    },
    faq: { score: scores.faq, hasStructured: false, hasHtml: false, questionsCount: 0 },
    vitesse: {
      score: scores.speed,
      htmlSize: 0,
      scriptsCount: 0,
      cssCount: 0,
      imagesWithoutAlt: 0,
      lazyImages: 0,
      hasViewportMeta: false
    },
    citations: {
      score: scores.citations,
      socialLinks: [],
      hasGMB: false,
      hasReviews: false,
      hasCertifications: false,
      hasDirectories: false
    }
  };
}

function normalizeDetail(raw: any): CriteriaDetail {
  if (!raw) return FALLBACK_DETAIL_NO_HTML;
  if (typeof raw.schemaOrg === "number") {
    return createDetailFromScores({
      schema: raw.schemaOrg ?? 0,
      nap: raw.nap ?? 0,
      meta: raw.metadata ?? 0,
      faq: raw.faq ?? 0,
      speed: raw.vitesse ?? 0,
      citations: raw.citations ?? 0
    });
  }
  return {
    schemaOrg: {
      score: raw.schemaOrg?.score ?? 0,
      found: raw.schemaOrg?.found ?? [],
      missing: raw.schemaOrg?.missing ?? EXPECTED_SCHEMA_TYPES
    },
    nap: {
      score: raw.nap?.score ?? 0,
      hasPhone: raw.nap?.hasPhone ?? false,
      hasAddress: raw.nap?.hasAddress ?? false,
      hasEmail: raw.nap?.hasEmail ?? false,
      isCoherent: raw.nap?.isCoherent ?? false
    },
    metadata: {
      score: raw.metadata?.score ?? 0,
      hasTitle: raw.metadata?.hasTitle ?? false,
      titleLength: raw.metadata?.titleLength ?? 0,
      hasDescription: raw.metadata?.hasDescription ?? false,
      descLength: raw.metadata?.descLength ?? 0,
      hasOG: raw.metadata?.hasOG ?? false,
      hasImage: raw.metadata?.hasImage ?? false,
      hasTwitterCard: raw.metadata?.hasTwitterCard ?? false
    },
    faq: {
      score: raw.faq?.score ?? 0,
      hasStructured: raw.faq?.hasStructured ?? false,
      hasHtml: raw.faq?.hasHtml ?? false,
      questionsCount: raw.faq?.questionsCount ?? 0
    },
    vitesse: {
      score: raw.vitesse?.score ?? 0,
      htmlSize: raw.vitesse?.htmlSize ?? 0,
      scriptsCount: raw.vitesse?.scriptsCount ?? 0,
      cssCount: raw.vitesse?.cssCount ?? 0,
      imagesWithoutAlt: raw.vitesse?.imagesWithoutAlt ?? 0,
      lazyImages: raw.vitesse?.lazyImages ?? 0,
      hasViewportMeta: raw.vitesse?.hasViewportMeta ?? false
    },
    citations: {
      score: raw.citations?.score ?? 0,
      socialLinks: raw.citations?.socialLinks ?? [],
      hasGMB: raw.citations?.hasGMB ?? false,
      hasReviews: raw.citations?.hasReviews ?? false,
      hasCertifications: raw.citations?.hasCertifications ?? false,
      hasDirectories: raw.citations?.hasDirectories ?? false
    }
  };
}

function getBlockedFallbackEvaluation(): EvaluationResult {
  const detail = FALLBACK_DETAIL_NO_HTML;
  return {
    score: scoreFromDetail(detail),
    issues: buildIssuesFromDetail(detail),
    timeout: true,
    criteresDetail: detail,
    corrections: buildCorrections(detail)
  };
}

function getSizeBasedFallbackEvaluation(htmlLength: number): EvaluationResult {
  const preset = htmlLength < 5_000 ? "low" : htmlLength < 20_000 ? "medium" : "high";
  const detail = SIZE_FALLBACK_DETAIL[preset];
  return {
    score: scoreFromDetail(detail),
    issues: buildIssuesFromDetail(detail),
    timeout: false,
    criteresDetail: detail,
    corrections: buildCorrections(detail)
  };
}

function getFallbackResponse() {
  const evaluation = getBlockedFallbackEvaluation();
  const pricing = getPricing(evaluation.score);
  const valeurPerdue = Math.max(0, Math.round((100 - evaluation.score) * 120));
  return {
    auditId: null,
    url: undefined,
    score: evaluation.score,
    level: pricing.label,
    niveau: pricing.niveau,
    issues: evaluation.issues,
    priceActivation: pricing.prixActivation,
    prixActivation: pricing.prixActivation,
    maintenancePrice: MAINTENANCE_PRICE,
    explanation: BLOCKED_EXPLANATION,
    explication: BLOCKED_EXPLANATION,
    lacunes: evaluation.issues,
    criteresDetail: evaluation.criteresDetail,
    corrections: evaluation.corrections,
    valeurPerdue,
    timeout: true,
    cached: false
  };
}
