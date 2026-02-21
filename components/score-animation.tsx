"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";

export function ScoreAnimation() {
  const controls = useAnimation();
  const [score, setScore] = useState(23);

  useEffect(() => {
    controls.start({ width: "100%", transition: { duration: 2.5, ease: "easeOut" } });
    let start = 0;
    const steps = [23, 60, 82, 100];
    const timer = setInterval(() => {
      setScore(() => {
        const value = steps[start] ?? 100;
        start += 1;
        if (start >= steps.length) {
          clearInterval(timer);
        }
        return value;
      });
    }, 600);
    return () => clearInterval(timer);
  }, [controls]);

  const gradient = "bg-gradient-to-r from-danger via-warning to-success";

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div className="flex items-center justify-between text-sm text-white/70">
        <span>Score Agentable</span>
        <span>{score}/100</span>
      </div>
      <div className="relative mt-4 h-3 w-full rounded-full bg-white/10">
        <motion.div
          animate={controls}
          className={`absolute inset-y-0 left-0 rounded-full ${gradient}`}
          style={{ width: "30%" }}
        />
      </div>
      <p className="mt-3 text-sm text-white/80">De rouge à vert en moins de 48h.</p>
    </div>
  );
}
