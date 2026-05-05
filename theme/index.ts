/**
 * Sticky Lingo Design Tokens
 *
 * Single source of truth for all visual values.
 * Never inline colors, font sizes, or spacing in components.
 * If you need a value that isn't here, add it here first.
 */

export const colors = {
  // Brand
  primary: '#FF6B5B',      // warm coral, primary actions, swipe progress
  primaryLight: '#FF8475', // hover/pressed state, secondary highlights

  // Surfaces
  background: '#FFFFFF',
  surface: '#FAFAFA',      // card background on light bg
  surfaceElevated: '#FFFFFF', // elevated card with shadow

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textTertiary: '#A0A0A0',
  textOnPrimary: '#FFFFFF', // text on coral background

  // Borders & dividers
  border: '#E8E8E8',
  divider: '#F0F0F0',

  // Semantic
  success: '#4CAF50',
  error: '#E53935',

  // Stage accents (subtle, used sparingly)
  stage1: '#FFE4E0', // easy words - lightest coral tint
  stage2: '#E0F2F1', // formal english
  stage3: '#FFF3E0', // patterns
  stage4: '#F3E5F5', // verbs
  stage5: '#ECEFF1', // coming soon
} as const;

export const typography = {
  fontFamily: {
    regular: 'Nunito_400Regular',
    semibold: 'Nunito_600SemiBold',
    bold: 'Nunito_700Bold',
    extrabold: 'Nunito_800ExtraBold',
  },
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 18,
    lg: 22,
    xl: 28,
    xxl: 36,
    display: 48, // hero word on card
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const spacing = {
  // 4pt grid
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2, // android
  },
  cardElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
} as const;

export const animation = {
  duration: {
    fast: 150,
    base: 250,
    slow: 400,
  },
} as const;

export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadow,
  animation,
} as const;

export type Theme = typeof theme;
export default theme;
