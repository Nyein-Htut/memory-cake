/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        cocoa: {
          50: "#faf6f3",
          100: "#f0e6dd",
          200: "#ddc3ae",
          300: "#c39d7d",
          400: "#a87850",
          500: "#8a5f3e",
          600: "#6f4a30",
          700: "#553827",
          800: "#3d281c",
          900: "#2a1a12",
          950: "#180f0a",
        },
        cream: "#fbf8f4",
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 24px rgba(42, 26, 18, 0.08)",
        card: "0 2px 16px rgba(42, 26, 18, 0.10)",
      },
    },
  },
  plugins: [],
};
