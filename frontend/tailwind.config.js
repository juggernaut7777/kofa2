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
        // Semantic Backgrounds
        app: 'var(--bg-app)',
        surface: {
          1: 'var(--bg-surface-1)',
          2: 'var(--bg-surface-2)',
          3: 'var(--bg-surface-3)',
        },

        // Semantic Text
        main: 'var(--text-main)',
        muted: 'var(--text-muted)',
        dim: 'var(--text-dim)',

        // Semantic Borders
        border: {
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },

        // Brand Colors
        brand: {
          primary: 'var(--brand-primary)',
          glow: 'var(--brand-glow)',
        },
      },
      backgroundImage: {
        'gradient-brand': 'var(--brand-gradient)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fadeIn': 'fadeIn 0.4s ease-out forwards',
        'slideUp': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        slideUp: {
          'from': { opacity: '0', transform: 'translateY(12px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
