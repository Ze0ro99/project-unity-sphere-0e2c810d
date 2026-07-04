/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0e17",
        panel: "#121826",
        panel2: "#1a2235",
        border: "#243049",
        muted: "#7d8ba6",
        text: "#e6edf7",
        gold: "#ffb020",
        purple: "#a970ff",
        green: "#3fb950",
        red: "#f85149",
        blue: "#58a6ff",
        orange: "#ff8c42",
        yellow: "#f0d95b",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
