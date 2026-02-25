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
    schemaOrg: number;
    nap: number;
    metadata: number;
    faq: number;
    vitesse: number;
    citations: number;
  };
  valeurPerdue?: number;
  timeout?: boolean;
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
