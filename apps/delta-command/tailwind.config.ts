import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#3B82F6",
          muted: "#EFF6FF",
          foreground: "#1D4ED8",
        },
        primary: {
          DEFAULT: "#2563EB",
          container: "#EFF6FF",
          on: "#FFFFFF",
          "on-container": "#1E40AF",
        },
        secondary: {
          DEFAULT: "#71717A",
          container: "#F4F4F5",
          on: "#FFFFFF",
          "on-container": "#3F3F46",
        },
        tertiary: {
          DEFAULT: "#A855F7",
          container: "#FAF5FF",
          on: "#FFFFFF",
          "on-container": "#7E22CE",
        },
        error: {
          DEFAULT: "#EF4444",
          container: "#FEF2F2",
          on: "#FFFFFF",
          "on-container": "#B91C1C",
        },
        surface: {
          DEFAULT: "#FAFAFA",
          dim: "#F4F4F5",
          bright: "#FFFFFF",
          container: {
            DEFAULT: "#F4F4F5",
            low: "#FAFAFA",
            high: "#E4E4E7",
            highest: "#D4D4D8",
          },
          on: "#09090B",
          "on-variant": "#71717A",
        },
        outline: {
          DEFAULT: "#A1A1AA",
          variant: "#E4E4E7",
        },
        sidebar: {
          DEFAULT: "#09090B",
          foreground: "#FAFAFA",
          muted: "#A1A1AA",
          border: "#27272A",
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
        "elevation-1": "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        "elevation-2": "0 4px 12px -2px rgb(0 0 0 / 0.08)",
        "elevation-3": "0 12px 24px -4px rgb(0 0 0 / 0.1)",
        card: "0 0 0 1px rgb(0 0 0 / 0.05), 0 1px 2px 0 rgb(0 0 0 / 0.04)",
        elevated: "0 0 0 1px rgb(0 0 0 / 0.05), 0 8px 24px -4px rgb(0 0 0 / 0.08)",
        glow: "0 0 0 3px rgb(59 130 246 / 0.15)",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.4, 0, 0.2, 1)",
        emphasized: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(to right, rgb(0 0 0 / 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgb(0 0 0 / 0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "24px 24px",
      },
    },
  },
  plugins: [],
};

export default config;
