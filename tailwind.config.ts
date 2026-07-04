import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Material Design 3 — light theme
        primary: {
          DEFAULT: "#005FB0",
          container: "#D3E4FF",
          on: "#FFFFFF",
          "on-container": "#001D36",
        },
        secondary: {
          DEFAULT: "#535F70",
          container: "#D8E3F8",
          on: "#FFFFFF",
          "on-container": "#101C2B",
        },
        tertiary: {
          DEFAULT: "#6B5778",
          container: "#F3DAFF",
          on: "#FFFFFF",
          "on-container": "#251431",
        },
        error: {
          DEFAULT: "#BA1A1A",
          container: "#FFDAD6",
          on: "#FFFFFF",
          "on-container": "#410002",
        },
        surface: {
          DEFAULT: "#F8F9FF",
          dim: "#D8DAE0",
          bright: "#F8F9FF",
          container: {
            DEFAULT: "#ECEEF4",
            low: "#F2F3F9",
            high: "#E6E8EE",
            highest: "#E0E2E8",
          },
          on: "#191C20",
          "on-variant": "#42474E",
        },
        outline: {
          DEFAULT: "#74777F",
          variant: "#C4C6D0",
        },
        inverse: {
          surface: "#2E3135",
          "on-surface": "#F0F0F7",
          primary: "#A4C9FF",
        },
        // Legacy alias for gradual migration
        brand: {
          50: "#E8F1FF",
          100: "#D3E4FF",
          200: "#A4C9FF",
          300: "#76ADFA",
          400: "#4792F2",
          500: "#005FB0",
          600: "#004A88",
          700: "#003660",
          800: "#002238",
          900: "#001024",
          950: "#000812",
        },
      },
      fontFamily: {
        sans: ["var(--font-roboto)", "Roboto", "system-ui", "sans-serif"],
        display: ["var(--font-roboto)", "Roboto", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "28px",
        full: "9999px",
      },
      boxShadow: {
        "elevation-0": "none",
        "elevation-1":
          "0px 1px 2px 0px rgba(0,0,0,0.30), 0px 1px 3px 1px rgba(0,0,0,0.15)",
        "elevation-2":
          "0px 1px 2px 0px rgba(0,0,0,0.30), 0px 2px 6px 2px rgba(0,0,0,0.15)",
        "elevation-3":
          "0px 1px 3px 0px rgba(0,0,0,0.30), 0px 4px 8px 3px rgba(0,0,0,0.15)",
        "elevation-4":
          "0px 2px 3px 0px rgba(0,0,0,0.30), 0px 6px 10px 4px rgba(0,0,0,0.15)",
        card: "0px 1px 2px 0px rgba(0,0,0,0.30), 0px 1px 3px 1px rgba(0,0,0,0.15)",
        elevated:
          "0px 1px 2px 0px rgba(0,0,0,0.30), 0px 2px 6px 2px rgba(0,0,0,0.15)",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.2, 0, 0, 1)",
        emphasized: "cubic-bezier(0.2, 0, 0, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
