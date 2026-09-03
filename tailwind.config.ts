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
        background: "var(--background)",
        foreground: "var(--foreground)",
        lodge: {
          50: "#fdf8f6",
          100: "#f2e8e5",
          200: "#eaddd7",
          300: "#e0cec7",
          400: "#d2bab0",
          500: "#9c6644",
          600: "#7f5539",
          700: "#634832",
          800: "#493628",
          900: "#2d2018",
        },
        status: {
          available: {
            bg: "#ecfdf5",
            text: "#065f46",
            border: "#a7f3d0",
            dot: "#10b981",
          },
          booked: {
            bg: "#fef2f2",
            text: "#991b1b",
            border: "#fecaca",
            dot: "#ef4444",
          },
          maintenance: {
            bg: "#fffbeb",
            text: "#92400e",
            border: "#fde68a",
            dot: "#f59e0b",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
