/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          DEFAULT: '#CCFF00',
          400: '#D4FF33',
          500: '#CCFF00',
          600: '#A3CC00',
        },
        emerald: {
          neon: '#00FF87',
        },
        dark: {
          950: '#07090E',
          900: '#0B0F17',
          800: '#131A26',
          700: '#1E293B',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'neon': 'none',
        'neon-lg': 'none',
      }
    },
  },
  plugins: [],
}
