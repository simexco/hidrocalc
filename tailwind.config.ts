import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1C3D5A",    // Pantone 7463 C — Sigma Flow
          dark: "#0F2438",       // Hover / sidebar
          light: "#E9EFF5",      // Card backgrounds
          accent: "#2A5F8F",     // Accent / links
          muted: "#3A6B8C",      // Secondary text
        },
        success: "#0F6E56",
        warning: "#B45309",
        danger: "#DC2626",
        neutral: {
          DEFAULT: "#64748B",
          light: "#F1F5F9",
        },
      },
      fontFamily: {
        sans: ['"Source Sans 3"', '"Inter"', 'system-ui', 'sans-serif'],
        heading: ['"Inter"', '"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
