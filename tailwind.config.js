/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        surface: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          900: '#0f172a',
        },
      },
      boxShadow: {
        soft: '0 10px 40px -20px rgba(15, 23, 42, 0.4)',
        card: '0 10px 30px -15px rgba(15, 23, 42, 0.35)',
      },
      backgroundImage: {
        'app-gradient': 'linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 50%, #312e81 100%)',
      },
    },
  },
  plugins: [],
}

