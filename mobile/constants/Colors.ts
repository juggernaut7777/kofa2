/**
 * Owo Flow Design System - Colors
 * Nigerian-inspired premium color palette
 */

// Primary Colors - Nigerian Green
export const primary = {
  DEFAULT: '#00A859',
  light: '#00C96A',
  dark: '#008948',
  50: '#E6F7EF',
  100: '#B3E8D1',
  500: '#00A859',
  600: '#008948',
  700: '#006B38',
};

// Accent Colors - Nigerian Gold
export const accent = {
  DEFAULT: '#FFD700',
  light: '#FFE44D',
  dark: '#CCB000',
};

// Dark Theme Colors
export const dark = {
  DEFAULT: '#1A1A2E',
  card: '#252542',
  muted: '#3D3D5C',
  surface: '#16162A',
};

// Light Theme Colors
export const light = {
  DEFAULT: '#FFFFFF',
  muted: '#F5F5F5',
  surface: '#FAFAFA',
  border: '#E5E5E5',
};

// Semantic Colors
export const semantic = {
  success: '#00C96A',
  warning: '#FFB800',
  error: '#FF4D4D',
  info: '#3B82F6',
};

// Naira/Money Colors
export const naira = {
  text: '#00A859',
  background: 'rgba(0, 168, 89, 0.1)',
};

// Gradient Presets
export const gradients = {
  primary: ['#00A859', '#00C96A'],
  gold: ['#FFD700', '#FFE44D'],
  dark: ['#1A1A2E', '#252542'],
  card: ['#252542', '#3D3D5C'],
};

// Combined Colors Object
export const Colors = {
  primary,
  accent,
  dark,
  light,
  semantic,
  naira,
  gradients,
  // Quick access
  text: {
    primary: '#1A1A2E',
    secondary: '#6B7280',
    inverted: '#FFFFFF',
    muted: '#9CA3AF',
  },
  background: {
    dark: '#1A1A2E',
    light: '#FFFFFF',
    card: '#252542',
  },
};

export default Colors;
