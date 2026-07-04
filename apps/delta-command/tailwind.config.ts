import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        google: {
          blue: "#4285F4",
          red: "#EA4335",
          yellow: "#FBBC04",
          green: "#34A853",
        },
        accent: {
          DEFAULT: "#4285F4",
          muted: "rgb(66 133 244 / 0.1)",
          foreground: "#1967D2",
        },
        primary: {
          DEFAULT: "#4285F4",
          container: "rgb(66 133 244 / 0.1)",
          on: "#FFFFFF",
          "on-container": "#1967D2",
        },
        secondary: {
          DEFAULT: "#5F6368",
          container: "#F1F3F4",
          on: "#202124",
          "on-container": "#5F6368",
        },
        tertiary: {
          DEFAULT: "#34A853",
          container: "rgb(52 168 83 / 0.1)",
          on: "#FFFFFF",
          "on-container": "#137333",
        },
        error: {
          DEFAULT: "#EA4335",
          container: "rgb(234 67 53 / 0.1)",
          on: "#FFFFFF",
          "on-container": "#C5221F",
        },
        surface: {
          DEFAULT: "#F8F9FA",
          dim: "#F1F3F4",
          bright: "#FFFFFF",
          container: {
            DEFAULT: "#F1F3F4",
            low: "#FFFFFF",
            high: "#E8EAED",
            highest: "#DADCE0",
          },
          on: "#202124",
          "on-variant": "#5F6368",
        },
        outline: {
          DEFAULT: "#DADCE0",
          variant: "#E8EAED",
        },
        sidebar: {
          DEFAULT: "#FFFFFF",
          foreground: "#202124",
          muted: "#5F6368",
          border: "#E8EAED",
          accent: "#4285F4",
        },
        brand: {
          50: "#E8F0FE",
          100: "#D2E3FC",
          500: "#4285F4",
          600: "#1967D2",
          700: "#185ABC",
          900: "#174EA6",
        },
      },
      fontFamily: {
        sans: ["var(--font-roboto)", "Roboto", "Arial", "sans-serif"],
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        full: "9999px",
      },
      boxShadow: {
        "elevation-0": "none",
        "elevation-1": "0 1px 2px 0 rgb(60 64 67 / 0.3), 0 1px 3px 1px rgb(60 64 67 / 0.15)",
        "elevation-2": "0 1px 2px 0 rgb(60 64 67 / 0.3), 0 2px 6px 2px rgb(60 64 67 / 0.15)",
        "elevation-3": "0 4px 8px 3px rgb(60 64 67 / 0.15), 0 1px 3px rgb(60 64 67 / 0.3)",
        card: "0 1px 2px 0 rgb(60 64 67 / 0.3), 0 1px 3px 1px rgb(60 64 67 / 0.15)",
        elevated:
          "0 1px 3px 0 rgb(60 64 67 / 0.3), 0 4px 8px 3px rgb(60 64 67 / 0.15)",
        glow: "0 0 0 2px rgb(66 133 244 / 0.3)",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.4, 0, 0.2, 1)",
        emphasized: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(to right, rgb(218 220 224 / 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgb(218 220 224 / 0.5) 1px, transparent 1px)",
        "radial-glow":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgb(66 133 244 / 0.06), transparent)",
      },
      backgroundSize: {
        grid: "24px 24px",
      },
    },
  },
  plugins: [],
};

export default config;
