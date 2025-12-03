/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F9F7F1',
        ink: '#111111',
        graphite: '#4A4A4A',
        'red-ink': '#D93025',
        highlighter: '#FEF08A',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'hard': '4px 4px 0px 0px #111111',
        'hard-sm': '2px 2px 0px 0px #111111',
        'pressed': 'inset 2px 2px 0px 0px #111111',
      }
    },
  },
  plugins: [],
}