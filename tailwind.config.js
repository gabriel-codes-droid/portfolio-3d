/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'space-dark': '#0a0a0f',
        'space-purple': '#6b21a8',
        'space-blue': '#1e3a8a',
        'space-cyan': '#0891b2'
      },
      fontFamily: {
        futuristic: ['system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}