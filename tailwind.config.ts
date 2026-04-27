import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        sand: "#E2E8F0",
        ember: "#94A3B8",
        spruce: "#0F172A",
        mist: "#CBD5E1",
        blush: "#BFDBFE"
      },
      boxShadow: {
        panel: "0 30px 80px rgba(2, 6, 23, 0.38)"
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(circle at top, rgba(56, 189, 248, 0.12), transparent 35%), radial-gradient(circle at 80% 10%, rgba(251, 191, 36, 0.1), transparent 24%), linear-gradient(180deg, rgba(4, 9, 17, 0) 0%, rgba(4, 9, 17, 0.72) 60%, rgba(4, 9, 17, 0) 100%)"
      }
    }
  },
  plugins: []
};

export default config;
