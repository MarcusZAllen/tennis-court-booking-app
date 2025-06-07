import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./public/**/*.html"
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
    },
  },
  plugins: [],
}

export default config