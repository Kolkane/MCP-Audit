"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type AnalyzeResponse = {
  auditId: string | null;
  url?: string;
  score: number;
  issues: string[];
  priceActivation: number;
  maintenancePrice?: number;
  level?: string;
  niveau?: string;
  explanation?: string;
  criteresDetail?: {
    schemaOrg: {
      score: number;
      found: string[];
      missing: string[];
    };
    nap: {
      score: number;
      hasPhone: boolean;
      hasAddress: boolean;
      hasEmail: boolean;
      isCoherent: boolean;
    };
    metadata: {
      score: number;
      hasTitle: boolean;
      titleLength: number;
      hasDescription: boolean;
      descLength: number;
      hasOG: boolean;
      hasImage: boolean;
      hasTwitterCard: boolean;
    };
    faq: {
      score: number;
      hasStructured: boolean;
      hasHtml: boolean;
      questionsCount: number;
    };
    vitesse: {
      score: number;
      htmlSize: number;
      scriptsCount: number;
      cssCount: number;
      imagesWithoutAlt: number;
      lazyImages: number;
      hasViewportMeta: boolean;
    };
    citations: {
      score: number;
      socialLinks: string[];
      hasGMB: boolean;
      hasReviews: boolean;
      hasCertifications: boolean;
      hasDirectories: boolean;
    };
  };
  corrections?: Array<{
    critere: string;
    probleme: string;
    solution: string;
    impact: "critique" | "important" | "utile";
  }>;
  valeurPerdue?: number;
  timeout?: boolean;
  cached?: boolean;
};

type AnalysisState = "idle" | "loading" | "done";

interface HeroAnalyzerContextValue {
  reset: () => void;
  url: string;
  setUrl: (value: string) => void;
  result: AnalyzeResponse | null;
  analysisState: AnalysisState;
  error: string | null;
  analyze: (targetUrl?: string) => Promise<void>;
  setError: (message: string | null) => void;
}

const HeroAnalyzerContext = createContext<HeroAnalyzerContextValue | undefined>(undefined);

export function HeroAnalyzerProvider({ children }: { children: ReactNode }) {
  const [url, setUrl] = useState("");
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (inputUrl?: string) => {
    const target = (inputUrl ?? url).trim();
    if (!target) return;
    setUrl(target);
    setAnalysisState("loading");
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target })
      });
      if (!response.ok) {
        throw new Error("Analyse impossible");
      }
      const data = (await response.json()) as AnalyzeResponse;
      setResult(data);
      setAnalysisState("done");
    } catch (err) {
      console.error(err);
      setError("Impossible d'analyser cette URL pour l'instant. Réessaie dans un instant.");
      setAnalysisState("idle");
    }
  };

  const reset = () => {
    setUrl("");
    setResult(null);
    setAnalysisState("idle");
    setError(null);
  };

  return (
    <HeroAnalyzerContext.Provider
      value={{ url, setUrl, result, analysisState, error, analyze, setError, reset }}
    >
      {children}
    </HeroAnalyzerContext.Provider>
  );
}

export function useHeroAnalyzer() {
  const context = useContext(HeroAnalyzerContext);
  if (!context) {
    throw new Error("useHeroAnalyzer must be used within a HeroAnalyzerProvider");
  }
  return context;
}
