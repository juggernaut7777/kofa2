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
        // KOFA Brand Primary Colors
        kofa: {
          cobalt: '#0047AB',      // Primary brand color
          navy: '#000080',         // Dark accents, headers
          sky: '#82C8E5',          // Light accents, highlights
          steel: '#6D8196',        // Neutral, muted elements
        },
        // Status/Indicator Colors
        success: '#10B981',        // Emerald - positive actions
        warning: '#F59E0B',        // Amber - alerts
        danger: '#F43F5E',         // Rose - errors, expenses
        // Dark mode backgrounds
        dark: {
          bg: '#0a0a0f',
          card: '#12121a',
          border: '#1e1e2e',
        }
      },
      backgroundImage: {
        'kofa-gradient': 'linear-gradient(135deg, #0047AB 0%, #000080 100%)',
        'kofa-gradient-light': 'linear-gradient(135deg, #82C8E5 0%, #0047AB 100%)',
      },
      boxShadow: {
        'kofa': '0 4px 20px rgba(0, 71, 171, 0.25)',
        'kofa-lg': '0 10px 40px rgba(0, 71, 171, 0.3)',
      }
    },
  },
  plugins: [],
}
