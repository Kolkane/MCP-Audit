import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        accent: "#6366F1",
        danger: "#EF4444",
        warning: "#F97316",
        success: "#22C55E"
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 30px rgba(99, 102, 241, 0.4)"
      }
    }
  },
  plugins: []
};

export default config;
