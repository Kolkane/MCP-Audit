import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { getActivationPrice, MAINTENANCE_PRICE } from "@/lib/pricing";

const defaultPrice = getActivationPrice(35);
const DEFAULT_RESULT = {
  score: 35,
  issues: [
    "Aucun schema.org détecté",
    "Coordonnées introuvables pour les IA",
    "Meta description manquante"
  ],
  priceActivation: defaultPrice.price,
  stripePrice: defaultPrice.stripePrice,
  level: defaultPrice.label,
  maintenancePrice: MAINTENANCE_PRICE,
  stripeMaintenance: process.env.STRIPE_PRICE_MAINTENANCE,
  lacunes: [
    "Vos données schema.org sont absentes ou incomplètes",
    "Vos coordonnées (NAP) sont illisibles par les agents IA",
    "Vos métadonnées ne sont pas optimisées pour ChatGPT"
  ]
};

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL manquante" }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch (error) {
      return NextResponse.json({ error: "URL invalide" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let html: string;
    try {
      const response = await fetch(parsed.toString(), {
        signal: controller.signal,
        headers: { "User-Agent": "AgentableAudit/1.0" }
      });
      html = await response.text();
    } catch (error) {
      clearTimeout(timeout);
      return NextResponse.json({ ...DEFAULT_RESULT, timeout: true });
    }

    clearTimeout(timeout);

    const $ = cheerio.load(html);

    const schemaScore = evaluateSchema($);
    const napScore = evaluateNAP($);
    const metaScore = evaluateMeta($);
    const faqScore = evaluateFAQ($);

    const speedScore = 15; // heuristique simple pour l'instant
    const citationScore = 5; // placeholder

    const rawScore = schemaScore + napScore + metaScore + faqScore + speedScore + citationScore;
    const score = Math.min(100, Math.round(rawScore));
    const issues = collectIssues({ schemaScore, napScore, metaScore, faqScore });
    const price = getActivationPrice(score);

    return NextResponse.json({
      score,
      issues,
      priceActivation: price.price,
      stripePrice: price.stripePrice,
      level: price.label,
      maintenancePrice: MAINTENANCE_PRICE,
      stripeMaintenance: process.env.STRIPE_PRICE_MAINTENANCE,
      lacunes: issues,
      timeout: false
    });
  } catch (error) {
    console.error("Analyze error", error);
    return NextResponse.json({ ...DEFAULT_RESULT, timeout: true });
  }
}

type Scores = {
  schemaScore: number;
  napScore: number;
  metaScore: number;
  faqScore: number;
};

function evaluateSchema($: cheerio.CheerioAPI) {
  const scripts = $('script[type="application/ld+json"]').toArray();
  const hasOrg = scripts.some((script) => {
    try {
      const json = JSON.parse($(script).text());
      if (Array.isArray(json)) {
        return json.some((entry) => typeof entry === "object" && entry["@type"] && `${entry["@type"]}`.toLowerCase().includes("organization"));
      }
      return json && json["@type"] && `${json["@type"]}`.toLowerCase().includes("organization");
    } catch (error) {
      return false;
    }
  });
  return hasOrg ? 20 : 8;
}

function evaluateNAP($: cheerio.CheerioAPI) {
  const text = $("body").text();
  const hasPhone = /\+?\d[\d\s().-]{6,}/.test(text);
  const hasAddress = /(rue|avenue|boulevard|road|street|st\.|rd\.)/i.test(text);
  return hasPhone && hasAddress ? 20 : hasPhone || hasAddress ? 12 : 6;
}

function evaluateMeta($: cheerio.CheerioAPI) {
  const description = $('meta[name="description"]').attr("content");
  const ogTitle = $('meta[property="og:title"]').attr("content");
  const ogDesc = $('meta[property="og:description"]').attr("content");
  const count = [description, ogTitle, ogDesc].filter(Boolean).length;
  if (count === 3) return 20;
  if (count === 2) return 14;
  if (count === 1) return 8;
  return 4;
}

function evaluateFAQ($: cheerio.CheerioAPI) {
  const hasFAQ = $('script[type="application/ld+json"]').toArray().some((script) => {
    try {
      const json = JSON.parse($(script).text());
      if (Array.isArray(json)) {
        return json.some((entry) => entry["@type"] === "FAQPage");
      }
      return json["@type"] === "FAQPage";
    } catch (error) {
      return false;
    }
  });
  return hasFAQ ? 20 : 4;
}

function collectIssues({ schemaScore, napScore, metaScore, faqScore }: Scores) {
  const issues: string[] = [];
  if (schemaScore < 15) issues.push("Vos données schema.org sont absentes ou incomplètes");
  if (napScore < 15) issues.push("Vos coordonnées (NAP) sont illisibles par les agents IA");
  if (metaScore < 15) issues.push("Vos métadonnées ne sont pas optimisées pour ChatGPT");
  if (faqScore < 15) issues.push("Aucune FAQ structurée détectée");
  return issues.slice(0, 3);
}
