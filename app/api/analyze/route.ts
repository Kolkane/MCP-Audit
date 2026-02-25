import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import crypto from "crypto";

import { getPricing, MAINTENANCE_PRICE } from "@/lib/pricing";
import { getSupabaseServerClient } from "@/lib/supabase";

const FALLBACK_SCORE = 35;
const ANALYZE_TIMEOUT_MS = 15_000;
const MAX_ANALYSES_PER_HOUR = 3;

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

const DEFAULT_CRITERES_DETAIL = {
  schemaOrg: 10,
  nap: 10,
  metadata: 10,
  faq: 10,
  vitesse: 10,
  citations: 10
};

const FALLBACK_EXPLANATION = "Analyse indisponible pour l'instant. Nous avons attribué un score de précaution.";

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

    const { html, timedOut } = await fetchHtmlWithTimeout(parsed.toString());

    const evaluation = html ? evaluateSite(html, parsed) : getFallbackEvaluation();
    const pricing = getPricing(evaluation.score);
    const explanation = evaluation.timeout && evaluation.score === FALLBACK_SCORE
      ? FALLBACK_EXPLANATION
      : evaluation.issues[0] || "Votre site est déjà lisible par la plupart des agents IA.";
    const valeurPerdue = Math.max(0, Math.round((100 - evaluation.score) * 120));

    const { data: audit, error: insertError } = await supabase
      .from("analyses")
      .insert({
        url: parsed.toString(),
        score: evaluation.score,
        niveau: pricing.niveau,
        explication: explanation,
        lacunes: evaluation.issues,
        prix_activation: pricing.prixActivation,
        ip_hash: ipHash
      })
      .select("id")
      .single();

    if (insertError || !audit) {
      throw insertError || new Error("Audit insertion failed");
    }

    return NextResponse.json({
      auditId: audit.id,
      url: parsed.toString(),
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
      criteresDetail: evaluation.criteresDetail ?? DEFAULT_CRITERES_DETAIL,
      valeurPerdue,
      timeout: timedOut || evaluation.timeout
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

async function fetchHtmlWithTimeout(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "AgentableAudit/1.0" } });
    const html = await response.text();
    clearTimeout(timeout);
    return { html, timedOut: false };
  } catch (error) {
    clearTimeout(timeout);
    return { html: null, timedOut: true };
  }
}

type CriteriaScoreMap = Record<(typeof CRITERIA_LABELS)[number]["key"], number>;

function evaluateSite(html: string, targetUrl?: URL) {
  const $ = cheerio.load(html);

  const criteria: CriteriaScoreMap = {
    schema: scoreSchema($),
    nap: scoreNAP($),
    meta: scoreMetadata($),
    faq: scoreFAQ($),
    speed: scoreSpeed(html.length),
    citations: scoreCitations($, targetUrl?.hostname)
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
    criteresDetail: formatCriteriaDetail(criteria)
  };
}

function formatCriteriaDetail(map: CriteriaScoreMap) {
  return {
    schemaOrg: Math.round(map.schema),
    nap: Math.round(map.nap),
    metadata: Math.round(map.meta),
    faq: Math.round(map.faq),
    vitesse: Math.round(map.speed),
    citations: Math.round(map.citations)
  };
}

function scoreSchema($: cheerio.CheerioAPI) {
  return hasValidSchema($) ? 20 : 6;
}

function hasValidSchema($: cheerio.CheerioAPI) {
  const scripts = $('script[type="application/ld+json"]').toArray();
  return scripts.some((script) => {
    try {
      const json = JSON.parse($(script).text());
      const entries = Array.isArray(json) ? json : [json];
      return entries.some((entry) => {
        if (!entry || typeof entry !== "object") return false;
        const type = `${entry["@type"] || ""}`.toLowerCase();
        return Boolean(type) && (type.includes("organization") || type.includes("localbusiness"));
      });
    } catch (error) {
      return false;
    }
  });
}

function scoreNAP($: cheerio.CheerioAPI) {
  const text = $("body").text();
  const hasPhone = /\+?\d[\d\s().-]{6,}/.test(text);
  const hasAddress = /(rue|avenue|boulevard|road|street|route|chemin|place|impasse|paris|france|bp\s*\d+)/i.test(text);
  if (hasPhone && hasAddress) return 20;
  if (hasPhone || hasAddress) return 12;
  return 6;
}

function scoreMetadata($: cheerio.CheerioAPI) {
  const title = $("title").text().trim();
  const metaDesc = $('meta[name="description"]').attr("content")?.trim();
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
  const ogDesc = $('meta[property="og:description"]').attr("content")?.trim();
  const ogImage = $('meta[property="og:image"]').attr("content")?.trim();
  const filled = [title, metaDesc, ogTitle, ogDesc, ogImage].filter(Boolean).length;
  if (filled === 5) return 20;
  if (filled >= 4) return 16;
  if (filled >= 3) return 12;
  if (filled >= 2) return 8;
  if (filled >= 1) return 6;
  return 4;
}

function scoreFAQ($: cheerio.CheerioAPI) {
  const scripts = $('script[type="application/ld+json"]').toArray();
  const hasFaq = scripts.some((script) => {
    try {
      const json = JSON.parse($(script).text());
      const entries = Array.isArray(json) ? json : [json];
      return entries.some((entry) => entry && entry["@type"] === "FAQPage");
    } catch (error) {
      return false;
    }
  });
  return hasFaq ? 20 : 8;
}

function scoreSpeed(htmlLength: number) {
  if (htmlLength < 200_000) return 18;
  if (htmlLength < 450_000) return 14;
  return 10;
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

function getFallbackEvaluation() {
  return { score: FALLBACK_SCORE, issues: DEFAULT_ISSUES, timeout: true, criteresDetail: DEFAULT_CRITERES_DETAIL };
}

function getFallbackResponse() {
  const pricing = getPricing(FALLBACK_SCORE);
  const valeurPerdue = Math.max(0, Math.round((100 - FALLBACK_SCORE) * 120));
  return {
    auditId: null,
    url: undefined,
    score: FALLBACK_SCORE,
    level: pricing.label,
    niveau: pricing.niveau,
    issues: DEFAULT_ISSUES,
    priceActivation: pricing.prixActivation,
    prixActivation: pricing.prixActivation,
    maintenancePrice: MAINTENANCE_PRICE,
    explanation: FALLBACK_EXPLANATION,
    explication: FALLBACK_EXPLANATION,
    lacunes: DEFAULT_ISSUES,
    criteresDetail: DEFAULT_CRITERES_DETAIL,
    valeurPerdue,
    timeout: true
  };
}
