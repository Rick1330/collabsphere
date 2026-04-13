import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx,mdx}",
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        border: "var(--color-border)",
        background: "var(--color-bg-primary)",
        foreground: "var(--color-text-primary)",
        card: {
          DEFAULT: "var(--surface-card)",
          muted: "var(--surface-card-muted)",
          subtle: "var(--surface-card-subtle)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-bg-primary)",
          hover: "var(--color-accent-hover)",
        },
        muted: {
          DEFAULT: "var(--color-bg-secondary)",
          foreground: "var(--color-text-secondary)",
        },
        info: "var(--color-info)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        destructive: "var(--color-error)",
      },
      borderRadius: {
        xl: "var(--radius-xl)",
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        elevated: "var(--shadow-elevated)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
