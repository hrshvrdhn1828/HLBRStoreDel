import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        grass: {
          50: '#F4FAEF',
          100: '#E6F4DC',
          200: '#CBE8B4',
          300: '#AADB88',
          400: '#8BC34A',
          500: '#71A836',
          600: '#588329',
          700: '#446420',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
