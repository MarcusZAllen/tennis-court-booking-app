import type { Config } from 'tailwindcss'

const config = {
  content: [
    "./src/app/**/*.{ts,tsx,js,jsx}",
    "./src/pages/**/*.{ts,tsx,js,jsx}",
    "./src/components/**/*.{ts,tsx,js,jsx}",
    "./src/ui/**/*.{ts,tsx,js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          background1: "rgba(255,255,255,1)",
          background2: "rgba(252,244,237,1)",
          accent: "rgba(255,69,26,1)",
          primary: "rgb(124,180,107)",
          black: "#000000",
        },
      },
      fontFamily: {
        jost: ["var(--font-jost)", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config

export default config