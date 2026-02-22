"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

export function ScoreAnimation() {
  const [score, setScore] = useState(0);
  const bar = useSpring(0, { stiffness: 80, damping: 20 });
  const width = useTransform(bar, (value) => `${Math.max(0, Math.min(100, value))}%`);

  useEffect(() => {
    const end = 23;
    const duration = 1500;
    let rafId: number;
    let startTime: number | null = null;

    const tick = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const value = Math.round(end * progress);
      setScore(value);
      bar.set(value);
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [bar]);

  return (
    <div className="w-full rounded-3xl border border-border bg-white p-6 shadow-glow">
      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate">Score moyen PME FR</div>
      <div className="mt-4 flex items-end gap-3">
        <div className="text-5xl font-bold text-night">{score}</div>
        <div className="text-base font-medium text-slate">/100</div>
      </div>
      <p className="text-[11px] font-semibold text-danger">⚠ Zone critique</p>
      <div className="relative mt-3 h-2 w-full rounded-full bg-[#F1F5F9]">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-danger to-warning"
          style={{ width }}
        />
      </div>
      <p className="mt-2 text-[11px] font-semibold text-success">→ 80+ atteignable</p>
      <p className="mt-4 text-sm text-slate">Passe en zone verte dès 48h après l'audit.</p>
    </div>
  );
}
