/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nigerian-inspired palette
        primary: {
          DEFAULT: '#00A859',  // Nigerian green
          light: '#00C96A',
          dark: '#008948',
        },
        secondary: {
          DEFAULT: '#FFFFFF',
          muted: '#F5F5F5',
        },
        accent: {
          DEFAULT: '#FFD700',  // Gold accent
          light: '#FFE44D',
        },
        dark: {
          DEFAULT: '#1A1A2E',  // Deep background
          card: '#252542',
          muted: '#3D3D5C',
        },
        success: '#00C96A',
        warning: '#FFB800',
        error: '#FF4D4D',
        naira: '#00A859',  // For price displays
      },
      fontFamily: {
        sans: ['Inter', 'System'],
        display: ['Outfit', 'System'],
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.15)',
        'button': '0 4px 14px rgba(0, 168, 89, 0.4)',
      },
    },
  },
  plugins: [],
}
