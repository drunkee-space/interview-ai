/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#abc4ff",
        primaryDark: "#8faeff",
        bgMain: "#edf2fb",
        card: "#e2eafc",
        panel: "#d7e3fc",
        input: "#ccdbfd",
        hover: "#c1d3fe",
        button: "#b6ccfe",
      },
    },
  },
  plugins: [],
};
