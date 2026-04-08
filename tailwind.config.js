/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
    "./stories/**/*.{ts,tsx}",
    "./.storybook/**/*.{ts,tsx}",
    "./index.html",
    "./node_modules/@winm2m/react-stats-ui/dist/**/*.{js,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Inter", "Pretendard", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
