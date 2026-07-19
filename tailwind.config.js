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
          50: "#fdf8f3",
          100: "#f5e9db",
          200: "#e8d1b8",
          300: "#d4ac86",
          400: "#b98a5e",
          500: "#9c6f45",
          600: "#82603f",
          700: "#6b4d36",
          800: "#523c2c",
          900: "#3f2f24",
          950: "#2d221a",
        },
        cream: "#fbf6ee",
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "serif"],
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
