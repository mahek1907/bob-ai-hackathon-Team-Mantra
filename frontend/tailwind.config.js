/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0B0F19',
          800: '#111827',
          700: '#1F2937',
          600: '#374151',
        },
        ibm: {
          blue: '#0F62FE',
          darkBlue: '#0043CE',
          lightBlue: '#4589FF',
          cyan: '#1192E8',
        },
        alert: {
          critical: '#DA1E28',
          high: '#FF832B',
          medium: '#F1C21B',
          low: '#24A148',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      }
    },
  },
  plugins: [],
}
