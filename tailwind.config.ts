import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0D0D0D",
        surface: "#1A1A1A",
        card: "#222222",
        border: "#2E2E2E",
        accent: "#4ADE80",
        "accent-dark": "#22C55E",
        "text-primary": "#F5F5F5",
        "text-secondary": "#A3A3A3",
        "text-muted": "#666666",
        "status-pending": "#737373",
        "status-progress": "#EAB308",
        "status-completed": "#4ADE80",
        "status-cancelled": "#EF4444",
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "DM Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "12px",
        sm: "8px",
        lg: "16px",
        xl: "20px",
      },
    },
  },
  plugins: [],
};
export default config;
