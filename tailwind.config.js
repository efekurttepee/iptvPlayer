/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0d131f",
        cardDark: "#151d2d",
        brandBlue: "#1e3a8a",
        brandCyan: "#06b6d4",
        brandPurple: "#8b5cf6",
        brandPink: "#ec4899",
        brandOrange: "#f97316",
        brandGreen: "#10b981",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-live': 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
        'gradient-live-custom': 'linear-gradient(135deg, #0cebeb 0%, #20e3b2 50%, #29ffc6 100%)',
        'gradient-movies': 'linear-gradient(135deg, #8a2387 0%, #e94057 50%, #f27121 100%)',
        'gradient-movies-blue': 'linear-gradient(135deg, #7F00FF 0%, #E100FF 40%, #00d2ff 100%)',
        'gradient-series': 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
      }
    },
  },
  plugins: [],
}
