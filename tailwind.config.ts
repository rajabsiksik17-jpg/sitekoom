import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f1ff",
          100: "#ebe5ff",
          200: "#d9ccff",
          300: "#bda4ff",
          400: "#9d72ff",
          500: "#843dff",
          600: "#7a1aff",
          700: "#6d0ff0",
          800: "#5c0cc9",
          900: "#4c0ca4",
          950: "#2c036e",
        },
        ink: {
          900: "#0b0a1a",
          800: "#131126",
          700: "#1c1934",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Tajawal",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        display: ["var(--font-display)", "Tajawal", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #7a1aff 0%, #9d72ff 55%, #bda4ff 100%)",
        "hero-gradient":
          "radial-gradient(1200px 600px at 15% -10%, rgba(122,26,255,0.35), transparent 60%), radial-gradient(900px 500px at 90% 10%, rgba(157,114,255,0.25), transparent 55%)",
      },
      boxShadow: {
        soft: "0 8px 30px rgba(44, 3, 110, 0.08)",
        card: "0 2px 12px rgba(44, 3, 110, 0.06), 0 12px 40px rgba(44, 3, 110, 0.08)",
        glow: "0 0 0 1px rgba(122,26,255,0.15), 0 12px 40px rgba(122,26,255,0.25)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-reverse": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        marquee: "marquee 30s linear infinite",
        "marquee-reverse": "marquee-reverse 30s linear infinite",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
