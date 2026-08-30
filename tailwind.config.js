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
          50: '#f5f7ff',
          100: '#e8ecf8',
          200: '#d0d8ed',
          300: '#aab5d4',
          400: '#7e8aaf',
          500: '#5c6690',
          600: '#434d72',
          700: '#2e3556',
          800: '#1a1f3d',
          900: '#0d1129',
          950: '#06081a',
        },
        brand: {
          50: '#eef5ff',
          100: '#d9e9ff',
          200: '#bad5ff',
          300: '#8db9fb',
          400: '#5e98ef',
          500: '#3475da',
          600: '#245bc0',
          700: '#1f4899',
          800: '#1d3d7b',
          900: '#1c3565',
          950: '#122342',
        },
        accent: {
          50: '#f0fbfc',
          100: '#d9f3f6',
          200: '#b7e6eb',
          300: '#86d1da',
          400: '#54b7c4',
          500: '#3699a8',
          600: '#2d7c8a',
          700: '#296570',
          800: '#28535c',
          900: '#25464d',
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
