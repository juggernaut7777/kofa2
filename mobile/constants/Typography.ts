/**
 * Owo Flow Design System - Typography
 * Premium font configuration
 */

export const fonts = {
    // Font families
    sans: 'Inter',
    display: 'Outfit',
    mono: 'SpaceMono',

    // Font weights
    weights: {
        light: '300',
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
    },

    // Font sizes with line heights
    sizes: {
        xs: { fontSize: 12, lineHeight: 16 },
        sm: { fontSize: 14, lineHeight: 20 },
        base: { fontSize: 16, lineHeight: 24 },
        lg: { fontSize: 18, lineHeight: 28 },
        xl: { fontSize: 20, lineHeight: 28 },
        '2xl': { fontSize: 24, lineHeight: 32 },
        '3xl': { fontSize: 30, lineHeight: 36 },
        '4xl': { fontSize: 36, lineHeight: 40 },
        '5xl': { fontSize: 48, lineHeight: 48 },
    },
};

// Text style presets
export const textStyles = {
    // Headings
    h1: {
        fontFamily: fonts.display,
        fontSize: fonts.sizes['4xl'].fontSize,
        lineHeight: fonts.sizes['4xl'].lineHeight,
        fontWeight: fonts.weights.bold,
    },
    h2: {
        fontFamily: fonts.display,
        fontSize: fonts.sizes['3xl'].fontSize,
        lineHeight: fonts.sizes['3xl'].lineHeight,
        fontWeight: fonts.weights.bold,
    },
    h3: {
        fontFamily: fonts.display,
        fontSize: fonts.sizes['2xl'].fontSize,
        lineHeight: fonts.sizes['2xl'].lineHeight,
        fontWeight: fonts.weights.semibold,
    },
    h4: {
        fontFamily: fonts.sans,
        fontSize: fonts.sizes.xl.fontSize,
        lineHeight: fonts.sizes.xl.lineHeight,
        fontWeight: fonts.weights.semibold,
    },

    // Body text
    body: {
        fontFamily: fonts.sans,
        fontSize: fonts.sizes.base.fontSize,
        lineHeight: fonts.sizes.base.lineHeight,
        fontWeight: fonts.weights.regular,
    },
    bodySmall: {
        fontFamily: fonts.sans,
        fontSize: fonts.sizes.sm.fontSize,
        lineHeight: fonts.sizes.sm.lineHeight,
        fontWeight: fonts.weights.regular,
    },

    // Labels
    label: {
        fontFamily: fonts.sans,
        fontSize: fonts.sizes.sm.fontSize,
        lineHeight: fonts.sizes.sm.lineHeight,
        fontWeight: fonts.weights.medium,
    },
    labelSmall: {
        fontFamily: fonts.sans,
        fontSize: fonts.sizes.xs.fontSize,
        lineHeight: fonts.sizes.xs.lineHeight,
        fontWeight: fonts.weights.medium,
    },

    // Price display
    price: {
        fontFamily: fonts.display,
        fontSize: fonts.sizes.xl.fontSize,
        lineHeight: fonts.sizes.xl.lineHeight,
        fontWeight: fonts.weights.bold,
    },
    priceLarge: {
        fontFamily: fonts.display,
        fontSize: fonts.sizes['3xl'].fontSize,
        lineHeight: fonts.sizes['3xl'].lineHeight,
        fontWeight: fonts.weights.extrabold,
    },
};

export default fonts;
