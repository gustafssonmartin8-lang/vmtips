/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pitch: { 900: '#0a1f0a', 800: '#112211', 700: '#1a3320', 600: '#234d2e', 500: '#2d6639' },
        gold:  { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' },
        grass: { 400: '#4ade80', 500: '#22c55e' },
      },
      fontFamily: { display: ['"Bebas Neue"', 'cursive'], body: ['"Inter"', 'sans-serif'] },
      backgroundImage: {
        'pitch-lines': "repeating-linear-gradient(90deg,rgba(255,255,255,0.03) 0px,rgba(255,255,255,0.03) 1px,transparent 1px,transparent 80px)",
      }
    }
  },
  plugins: []
}
