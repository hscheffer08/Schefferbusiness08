/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      colors: {
        ink: {
          50: '#fffaf0',
          100: '#fffaf0',
          200: '#f6e5b3',
          300: '#f6e5b3',
          400: '#d8c792',
          500: '#c7b987',
          600: '#aa985f',
          700: '#171105',
          800: '#171105',
          900: '#0b0904',
          950: '#050505',
        },
        brand: {
          50: '#fffaf0',
          100: '#fff0a3',
          200: '#ffe77d',
          300: '#ffd45e',
          400: '#ffd45e',
          500: '#e0aa18',
          600: '#b88408',
          700: '#6f4f08',
          800: '#6f4f08',
          900: '#241904',
          950: '#171105',
        },
        accent: {
          50: '#fffaf0',
          100: '#fff0a3',
          200: '#ffe77d',
          300: '#ffd45e',
          400: '#e0aa18',
          500: '#b88408',
          600: '#6f4f08',
          700: '#241904',
          800: '#241904',
          900: '#171105',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-up': 'fadeUp 0.6s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
};
