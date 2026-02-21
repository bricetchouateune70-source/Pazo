/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef9e7',
          100: '#fcefc2',
          200: '#fae389',
          300: '#f8d24f',
          400: '#f5c518', // McDonald's Gold
          500: '#e6b000',
          600: '#c78900',
          700: '#9e6400',
          800: '#824f08',
          900: '#6e410b',
        },
        secondary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#da291c', // McDonald's Red
          600: '#c81e1e',
          700: '#a31919',
          800: '#861818',
          900: '#701a1a',
        },
      },
    },
  },
  plugins: [],
};
