/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Cold Vacuum palette — sourced from CSS custom properties so the
        // single source of truth lives in index.css.
        void: 'var(--void)',
        hull: 'var(--hull)',
        strut: 'var(--strut)',
        vapor: 'var(--vapor)',
        signal: 'var(--signal)',
        breach: 'var(--breach)',
        triage: 'var(--triage)',
        sleuth: 'var(--sleuth)',
      },
      fontFamily: {
        display: ['"Oswald"', '"Archivo Narrow"', 'system-ui', 'sans-serif'],
        body: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        app: '480px',
      },
      minHeight: {
        tap: '48px',
      },
      boxShadow: {
        signal: '0 0 0 1px var(--signal), 0 0 24px -4px var(--signal)',
        breach: '0 0 0 1px var(--breach), 0 0 32px -4px var(--breach)',
      },
      keyframes: {
        seam: {
          '0%,100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        seam: 'seam 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
