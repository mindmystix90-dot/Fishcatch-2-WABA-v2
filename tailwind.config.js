/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        whatsapp: {
          light: '#25D366',
          DEFAULT: '#128C7E',
          dark: '#075E54',
          bg: '#EFEAE2',
          bubbleOut: '#D9FDD3',
          bubbleIn: '#FFFFFF',
        },
        chatwoot: {
          DEFAULT: '#1f93ff',
          dark: '#126ecc',
          bg: '#f8fafc',
        }
      }
    }
  },
  plugins: [],
};
