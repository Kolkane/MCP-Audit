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

const FALLBACK_EXPLANATION = "Votre site présente plusieurs lacunes critiques détectées lors de l'analyse.";
const BLOCKED_EXPLANATION =
  "Votre site a limité l'accès lors de l'analyse. Score de précaution attribué — les lacunes détectées sont représentatives de la majorité des sites non optimisés.";

const FIXED_NO_HTML_DETAIL = {
  schemaOrg: 2,
  nap: 8,
  metadata: 6,
  faq: 1,
  vitesse: 12,
  citations: 3
};

const SIZE_FALLBACK_DETAIL = {
  low: { schemaOrg: 4, nap: 4, metadata: 4, faq: 3, vitesse: 5, citations: 4 },
  medium: { schemaOrg: 6, nap: 6, metadata: 6, faq: 5, vitesse: 6, citations: 7 },
  high: { schemaOrg: 8, nap: 8, metadata: 8, faq: 6, vitesse: 9, citations: 9 }
} as const;

type CriteriaScoreMap = Record<(typeof CRITERIA_LABELS)[number]["key"], number>;
type CriteriaDetail = {
  schemaOrg: number;
  nap: number;
  metadata: number;
  faq: number;
  vitesse: number;
  citations: number;
};
type EvaluationResult = {
  score: number;
  issues: string[];
  timeout: boolean;
  criteresDetail: CriteriaDetail;
  flags?: {
    hasSchema: boolean;
    hasNAP: boolean;
    hasMeta: boolean;
    hasFAQ: boolean;
  };
};

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

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
      const cachedScore = cachedAnalysis.score ?? FALLBACK_SCORE;
      const cachedPricing = getPricing(cachedScore);
      const cachedIssues = cachedAnalysis.lacunes ?? DEFAULT_ISSUES;
      const cachedDetail = (cachedAnalysis as any).criteres_detail ?? FIXED_NO_HTML_DETAIL;
      const cachedValeurPerdue =
        cachedAnalysis.valeur_perdue ?? Math.max(0, Math.round((100 - cachedScore) * 120));

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
      hasSchema: evaluation.flags?.hasSchema ?? false,
      hasNAP: evaluation.flags?.hasNAP ?? false,
      hasMeta: evaluation.flags?.hasMeta ?? false,
      hasFAQ: evaluation.flags?.hasFAQ ?? false,
      responseTime: fetchResult.responseTime ?? null,
      htmlLength: fetchResult.htmlLength ?? (fetchResult.html?.length ?? null)
    });

    const pricing = getPricing(evaluation.score);
    const explanation = usedBlockedFallback
      ? BLOCKED_EXPLANATION
      : evaluation.timeout
        ? FALLBACK_EXPLANATION
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
      valeurPerdue,
      timeout: (fetchResult.timedOut ?? false) || evaluation.timeout,
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

function scoreFromDetail(detail: CriteriaDetail) {
  const total =
    detail.schemaOrg +
    detail.nap +
    detail.metadata +
    detail.faq +
    detail.vitesse +
    detail.citations;
  return Math.max(0, Math.min(100, Math.round((total / 120) * 100)));
}

function buildIssuesFromDetail(detail: CriteriaDetail) {
  const issues: string[] = [];
  if (detail.schemaOrg < 15) issues.push(DEFAULT_ISSUES[0]);
  if (detail.nap < 15) issues.push(DEFAULT_ISSUES[1]);
  if (detail.metadata < 15) issues.push(DEFAULT_ISSUES[2]);
  if (detail.faq < 12) issues.push("Aucune FAQ structurée détectée");
  if (detail.vitesse < 14) issues.push("Votre site est trop lent pour être pleinement exploré par les IA");
  if (detail.citations < 12) issues.push("Peu de citations externes détectées par les agents IA");
  return issues.length ? issues : DEFAULT_ISSUES;
}

function deriveFlagsFromDetail(detail: CriteriaDetail) {
  return {
    hasSchema: detail.schemaOrg >= 15,
    hasNAP: detail.nap >= 15,
    hasMeta: detail.metadata >= 14,
    hasFAQ: detail.faq >= 12
  };
}

function evaluateSite(html: string, targetUrl?: URL): EvaluationResult {
  const $ = cheerio.load(html);
  const resourceCount = $("script[src], link[href], img[src]").length;

  const schema = assessSchema($);
  const nap = assessNAP($);
  const metadata = assessMetadata($);
  const faq = assessFAQ($);
  const speedScore = scoreSpeed(html.length, resourceCount);
  const citationsScore = scoreCitations($, targetUrl?.hostname);

  const criteria: CriteriaScoreMap = {
    schema: schema.score,
    nap: nap.score,
    meta: metadata.score,
    faq: faq.score,
    speed: speedScore,
    citations: citationsScore
  };

  const rawScore = Object.values(criteria).reduce((sum, value) => sum + value, 0);
  const normalizedScore = Math.max(0, Math.min(100, Math.round((rawScore / 120) * 100)));

  const issues: string[] = [];
  if (criteria.schema < 15) issues.push(DEFAULT_ISSUES[0]);
  if (criteria.nap < 15) issues.push(DEFAULT_ISSUES[1]);
  if (criteria.meta < 15) issues.push(DEFAULT_ISSUES[2]);
  if (criteria.faq < 15) issues.push("Aucune FAQ structurée détectée");

  return {
    score: normalizedScore,
    issues: issues.length ? issues : DEFAULT_ISSUES,
    timeout: false,
    criteresDetail: formatCriteriaDetail(criteria),
    flags: {
      hasSchema: schema.hasSchema,
      hasNAP: nap.hasNAP,
      hasMeta: metadata.hasMeta,
      hasFAQ: faq.hasFAQ
    }
  };
}

function formatCriteriaDetail(map: CriteriaScoreMap): CriteriaDetail {
  return {
    schemaOrg: Math.round(map.schema),
    nap: Math.round(map.nap),
    metadata: Math.round(map.meta),
    faq: Math.round(map.faq),
    vitesse: Math.round(map.speed),
    citations: Math.round(map.citations)
  };
}

function assessSchema($: cheerio.CheerioAPI) {
  const hasSchema = detectSchema($);
  return { score: hasSchema ? 20 : 6, hasSchema };
}

function detectSchema($: cheerio.CheerioAPI) {
  const scripts = $('script[type="application/ld+json"]').toArray();
  return scripts.some((script) => {
    try {
      const json = JSON.parse($(script).text());
      const entries = Array.isArray(json) ? json : [json];
      return entries.some((entry) => {
        if (!entry || typeof entry !== "object") return false;
        const type = `${entry["@type"] || ""}`.toLowerCase();
        return Boolean(type) && (type.includes("organization") || type.includes("localbusiness") || type.includes("service"));
      });
    } catch (error) {
      return false;
    }
  });
}

function assessNAP($: cheerio.CheerioAPI) {
  const text = $("body").text();
  const hasPhone = /\+?\d[\d\s().-]{6,}/.test(text);
  const hasAddress = /(rue|avenue|boulevard|road|street|route|chemin|place|impasse|paris|france|bp\s*\d+)/i.test(text);
  const hasNAP = hasPhone && hasAddress;
  const score = hasNAP ? 20 : hasPhone || hasAddress ? 12 : 6;
  return { score, hasNAP };
}

function assessMetadata($: cheerio.CheerioAPI) {
  const title = $("title").text().trim();
  const metaDesc = $('meta[name="description"]').attr("content")?.trim();
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
  const ogDesc = $('meta[property="og:description"]').attr("content")?.trim();
  const ogImage = $('meta[property="og:image"]').attr("content")?.trim();
  const filled = [title, metaDesc, ogTitle, ogDesc, ogImage].filter(Boolean).length;
  let score = 4;
  if (filled === 5) score = 20;
  else if (filled >= 4) score = 16;
  else if (filled >= 3) score = 12;
  else if (filled >= 2) score = 8;
  else if (filled >= 1) score = 6;
  return { score, hasMeta: filled >= 4 };
}

function assessFAQ($: cheerio.CheerioAPI) {
  const scripts = $('script[type="application/ld+json"]').toArray();
  const hasFAQ = scripts.some((script) => {
    try {
      const json = JSON.parse($(script).text());
      const entries = Array.isArray(json) ? json : [json];
      return entries.some((entry) => entry && entry["@type"] === "FAQPage");
    } catch (error) {
      return false;
    }
  });
  return { score: hasFAQ ? 20 : 8, hasFAQ };
}

function scoreSpeed(htmlLength: number, resourceCount: number) {
  if (htmlLength < 200_000 && resourceCount < 80) return 18;
  if (htmlLength < 350_000 && resourceCount < 120) return 16;
  if (htmlLength < 500_000) return 12;
  if (htmlLength < 700_000) return 10;
  return 8;
}

function scoreCitations($: cheerio.CheerioAPI, host?: string) {
  const links = $('a[href^="http"]').toArray();
  let externalCount = 0;
  links.forEach((link) => {
    const href = $(link).attr("href");
    if (!href) return;
    try {
      const linkUrl = new URL(href);
      if (!host || linkUrl.hostname !== host) {
        externalCount += 1;
      }
    } catch (error) {
      externalCount += 1;
    }
  });
  if (externalCount >= 20) return 18;
  if (externalCount >= 10) return 14;
  if (externalCount >= 4) return 10;
  return 6;
}

function getBlockedFallbackEvaluation(): EvaluationResult {
  return buildEvaluationFromDetail(FIXED_NO_HTML_DETAIL, true);
}

function getSizeBasedFallbackEvaluation(htmlLength: number): EvaluationResult {
  const preset = htmlLength < 5_000 ? "low" : htmlLength < 20_000 ? "medium" : "high";
  return buildEvaluationFromDetail(SIZE_FALLBACK_DETAIL[preset], false);
}

function buildEvaluationFromDetail(detail: CriteriaDetail, timeout: boolean): EvaluationResult {
  return {
    score: scoreFromDetail(detail),
    issues: buildIssuesFromDetail(detail),
    timeout,
    criteresDetail: detail,
    flags: deriveFlagsFromDetail(detail)
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
    valeurPerdue,
    timeout: true,
    cached: false
  };
}
