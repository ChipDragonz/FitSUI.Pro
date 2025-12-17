/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sui-blue': '#448aff',
        'neon-green': '#00ff41',
      },
      fontFamily: {
        // Đặt Be Vietnam Pro làm font mặc định (sans) và font hiển thị (display)
        sans: ['"Be Vietnam Pro"', 'sans-serif'],
        display: ['"Be Vietnam Pro"', 'sans-serif'], 
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}