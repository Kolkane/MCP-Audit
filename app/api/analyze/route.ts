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

    const evaluation = html ? evaluateSite(html) : getFallbackEvaluation();
    const pricing = getPricing(evaluation.score);
    const explanation = evaluation.timeout && evaluation.score === FALLBACK_SCORE
      ? FALLBACK_EXPLANATION
      : evaluation.issues[0] || "Votre site est déjà lisible par la plupart des agents IA.";

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

function evaluateSite(html: string) {
  const $ = cheerio.load(html);

  const schemaOk = hasValidSchema($);
  const napOk = hasNAP($);
  const metaOk = hasMetadata($);
  const faqOk = hasFAQ($);

  const score = (schemaOk ? 25 : 0) + (napOk ? 25 : 0) + (metaOk ? 25 : 0) + (faqOk ? 25 : 0);

  const issues: string[] = [];
  if (!schemaOk) issues.push(DEFAULT_ISSUES[0]);
  if (!napOk) issues.push(DEFAULT_ISSUES[1]);
  if (!metaOk) issues.push(DEFAULT_ISSUES[2]);
  if (!faqOk) issues.push("Aucune FAQ structurée détectée");

  return {
    score,
    issues,
    timeout: false
  };
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

function hasNAP($: cheerio.CheerioAPI) {
  const text = $("body").text();
  const hasPhone = /\+?\d[\d\s().-]{6,}/.test(text);
  const hasAddress = /(rue|avenue|boulevard|road|street|route|chemin|place|impasse|paris|france|bp\s*\d+)/i.test(text);
  return hasPhone && hasAddress;
}

function hasMetadata($: cheerio.CheerioAPI) {
  const title = $("title").text().trim();
  const metaDesc = $('meta[name="description"]').attr("content")?.trim();
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
  const ogDesc = $('meta[property="og:description"]').attr("content")?.trim();
  const ogImage = $('meta[property="og:image"]').attr("content")?.trim();
  return [title, metaDesc, ogTitle, ogDesc, ogImage].every(Boolean);
}

function hasFAQ($: cheerio.CheerioAPI) {
  const scripts = $('script[type="application/ld+json"]').toArray();
  return scripts.some((script) => {
    try {
      const json = JSON.parse($(script).text());
      const entries = Array.isArray(json) ? json : [json];
      return entries.some((entry) => entry && entry["@type"] === "FAQPage");
    } catch (error) {
      return false;
    }
  });
}

function getFallbackEvaluation() {
  return { score: FALLBACK_SCORE, issues: DEFAULT_ISSUES, timeout: true };
}

function getFallbackResponse() {
  const pricing = getPricing(FALLBACK_SCORE);
  return {
    auditId: null,
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
    timeout: true
  };
}
