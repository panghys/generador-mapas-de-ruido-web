// Frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  mode: "jit",
  theme: {
    extend: {
      colors: {
        primary: "#00040f",
        secondary: "#00f6ff",
        tertiary: "#161616",

        dimWhite: "rgba(255, 255, 255, 0.7)",
        dimBlue: "rgba(9, 151, 124, 0.1)",

        // Dashboard de proyectos (tema oscuro)
        dash: {
          bg: "#0F1417",
          surface: "#171D21",
          "surface-hover": "#1B2226",
          border: "#262E33",
          text: "#EDEFF0",
          "text-soft": "#8A949C",
          accent: "#2DD4BF",
          "accent-soft": "rgba(45, 212, 191, 0.12)",
        },
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
    screens: {
      xs: "480px",
      ss: "620px",
      sm: "768px",
      md: "1060px",
      lg: "1200px",
      xl: "1700px",
    },
  },
  plugins: [],
};