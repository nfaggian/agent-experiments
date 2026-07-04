import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#3B82F6",
          muted: "rgb(59 130 246 / 0.12)",
          foreground: "#60A5FA",
        },
        primary: {
          DEFAULT: "#3B82F6",
          container: "rgb(59 130 246 / 0.12)",
          on: "#FFFFFF",
          "on-container": "#93C5FD",
        },
        secondary: {
          DEFAULT: "#71717A",
          container: "#27272A",
          on: "#FAFAFA",
          "on-container": "#A1A1AA",
        },
        tertiary: {
          DEFAULT: "#A855F7",
          container: "rgb(168 85 247 / 0.12)",
          on: "#FFFFFF",
          "on-container": "#C4B5FD",
        },
        error: {
          DEFAULT: "#EF4444",
          container: "rgb(239 68 68 / 0.12)",
          on: "#FFFFFF",
          "on-container": "#FCA5A5",
        },
        surface: {
          DEFAULT: "#09090B",
          dim: "#0C0C0E",
          bright: "#18181B",
          container: {
            DEFAULT: "#27272A",
            low: "#141416",
            high: "#3F3F46",
            highest: "#52525B",
          },
          on: "#FAFAFA",
          "on-variant": "#A1A1AA",
        },
        outline: {
          DEFAULT: "#52525B",
          variant: "#27272A",
        },
        sidebar: {
          DEFAULT: "#030712",
          foreground: "#FAFAFA",
          muted: "#71717A",
          border: "#1F2937",
          accent: "#3B82F6",
        },
        brand: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          900: "#1E3A8A",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xs: "6px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        full: "9999px",
      },
      boxShadow: {
        "elevation-0": "none",
        "elevation-1": "0 1px 2px 0 rgb(0 0 0 / 0.4)",
        "elevation-2": "0 4px 12px -2px rgb(0 0 0 / 0.5)",
        "elevation-3": "0 12px 24px -4px rgb(0 0 0 / 0.6)",
        card: "0 0 0 1px rgb(255 255 255 / 0.06), 0 1px 2px 0 rgb(0 0 0 / 0.4)",
        elevated:
          "0 0 0 1px rgb(255 255 255 / 0.08), 0 8px 24px -4px rgb(0 0 0 / 0.5)",
        glow: "0 0 0 3px rgb(59 130 246 / 0.25), 0 0 20px rgb(59 130 246 / 0.15)",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.4, 0, 0.2, 1)",
        emphasized: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(to right, rgb(255 255 255 / 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.04) 1px, transparent 1px)",
        "radial-glow":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgb(59 130 246 / 0.08), transparent)",
      },
      backgroundSize: {
        grid: "24px 24px",
      },
    },
  },
  plugins: [],
};

export default config;
