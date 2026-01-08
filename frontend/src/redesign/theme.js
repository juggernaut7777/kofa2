// KOFA Redesign Theme Configuration
// Based on Stitch design - Green accent with light/dark modes
// This config is shared between web and future mobile app

export const theme = {
    colors: {
        // Primary accent
        primary: '#2bee79',
        primaryDark: '#25d66d',
        primaryLight: '#5ef59a',

        // Backgrounds
        backgroundLight: '#f6f8f7',
        backgroundDark: '#102217',

        // Cards
        cardLight: '#ffffff',
        cardDark: '#1a2c22',

        // Text
        textPrimary: '#111814',
        textSecondary: '#618971',
        textMuted: '#9ca3af',

        // Status colors
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',

        // Borders
        borderLight: '#e5e7eb',
        borderDark: 'rgba(255,255,255,0.05)',
    },

    fonts: {
        display: '"Manrope", sans-serif',
    },

    borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        full: '9999px',
    },

    shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    }
}

// Tailwind color extensions for use in className
export const tailwindColors = {
    'primary': '#2bee79',
    'background-light': '#f6f8f7',
    'background-dark': '#102217',
    'card-light': '#ffffff',
    'card-dark': '#1a2c22',
}

export default theme
