import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    container: { center: true, padding: "2rem" },
    extend: {
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(0,0,0,0.08), 0 1px 2px 0 rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
