import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        surface: "#F8F9FF",
        slate: "#64748B",
        night: "#0F172A",
        accent: "#6366F1",
        accentLight: "#818CF8",
        border: "#E2E8F0",
        success: "#22C55E",
        danger: "#EF4444"
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"]
      },
      boxShadow: {
        glow: "0 4px 24px rgba(99, 102, 241, 0.08)",
        glowStrong: "0 8px 40px rgba(99, 102, 241, 0.2)",
        card: "0 8px 32px rgba(99, 102, 241, 0.15)"
      }
    }
  },
  plugins: []
};

export default config;
