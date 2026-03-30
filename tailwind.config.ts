import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        red: {
          DEFAULT: "#e8220a",
          dark: "#b81a08",
        },
        bg: {
          DEFAULT: "#0a0a0a",
          2: "#111111",
          3: "#181818",
        },
        card: "#141414",
        muted: "#777777",
        border: "rgba(255,255,255,0.08)",
      },
      fontFamily: {
        barlow: ["Barlow", "sans-serif"],
        "barlow-condensed": ["Barlow Condensed", "sans-serif"],
      },
      boxShadow: {
        "red-glow": "0 2px 12px rgba(232,34,10,0.3)",
        "red-glow-lg": "0 4px 16px rgba(232,34,10,0.3)",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          from: { transform: "scale(0)" },
          to: { transform: "scale(1)" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease both",
        pop: "pop 0.5s ease both",
        spin: "spin 0.7s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
