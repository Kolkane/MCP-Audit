"use client";

import { AnalyzeResponse } from "@/components/hero-analyzer-context";
import { BlockScore } from "@/components/report/BlockScore";
import { BlockCriteres } from "@/components/report/BlockCriteres";
import { BlockCorrections } from "@/components/report/BlockCorrections";
import { BlockConversion } from "@/components/report/BlockConversion";

type Props = {
  result: AnalyzeResponse;
  checkoutLoading: "activation" | "maintenance" | null;
  onCheckout: (withMaintenance: boolean) => Promise<void>;
};

export default function ResultReport({ result, checkoutLoading, onCheckout }: Props) {
  return (
    <div className="w-full max-w-6xl mx-auto px-8 flex flex-col gap-8">
      <BlockScore result={result} />
      <BlockCriteres result={result} />
      <BlockCorrections result={result} />
      <BlockConversion result={result} checkoutLoading={checkoutLoading} onCheckout={onCheckout} />
    </div>
  );
}
