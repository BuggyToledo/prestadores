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
        brand: {
          amber: '#f59e0b',
          'amber-dark': '#d97706',
          'amber-light': '#fef3c7',
          navy: '#0f172a',
          'navy-mid': '#1e293b',
          'navy-deep': '#0b132b',
          green: '#16a34a',
          'green-bright': '#22c55e',
          'green-dark': '#15803d',
          surface: '#f8f9ff',
          card: '#ffffff',
          border: '#e2e8f0',
          muted: '#64748b',
        },
        // Compatibilidade com classes primary-* existentes
        primary: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        shell: '1200px',
      },
      borderRadius: {
        card: '1rem',
        control: '0.75rem',
      },
      boxShadow: {
        card: '0 2px 8px -2px rgba(15, 23, 42, 0.06), 0 1px 4px -1px rgba(15, 23, 42, 0.04)',
        lift: '0 10px 25px -5px rgba(15, 23, 42, 0.10), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
      },
      minHeight: {
        touch: '48px',
      },
      minWidth: {
        touch: '48px',
      },
    },
  },
  plugins: [],
};
