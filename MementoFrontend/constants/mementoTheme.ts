export const MementoColors = {
  // Black and white color palette
  primary: '#000000', // Pure black
  primaryLight: '#374151', // Dark grey
  primaryDark: '#000000', // Pure black
  secondary: '#6B7280', // Medium grey
  tertiary: '#059669', // Professional green accent
  
  // Background colors - Clean whites and greys
  background: '#FFFFFF', // Pure white
  backgroundSecondary: '#F9FAFB', // Very light grey
  backgroundCard: '#FFFFFF', // White cards
  backgroundSidebar: '#F3F4F6', // Light grey sidebar
  backgroundGradient: ['#FFFFFF', '#F9FAFB'], // Subtle gradient
  
  // Text colors - Black and greys
  textPrimary: '#000000', // Pure black
  textSecondary: '#374151', // Dark grey
  textTertiary: '#6B7280', // Medium grey
  textMuted: '#9CA3AF', // Light grey
  
  // Border colors - Clean and minimal
  border: '#E5E7EB', // Light grey border
  borderLight: '#F3F4F6', // Very light border
  borderMedium: '#D1D5DB', // Medium border
  borderDark: '#6B7280', // Dark grey border
  
  // Status colors - Professional palette
  success: '#059669', // Professional green
  warning: '#D97706', // Professional amber
  error: '#DC2626', // Professional red
  info: '#6B7280', // Medium grey
  
  // Accent colors - Minimal and professional
  accent: '#000000', // Pure black accent
  accentLight: '#374151', // Dark grey
  
  // Legacy support for existing components
  text: {
    primary: '#000000', // Pure black
    secondary: '#374151', // Dark grey
    muted: '#6B7280', // Medium grey
    white: '#FFFFFF' // White
  },
  
  border: {
    light: '#F3F4F6', // Very light border
    medium: '#D1D5DB', // Medium border
    dark: '#6B7280' // Dark grey border
  },
  
  // Stats colors - Black and white palette
  stats: {
    contacts: '#000000', // Pure black
    encounters: '#374151', // Dark grey
    thisWeek: '#6B7280', // Medium grey
    notes: '#9CA3AF' // Light grey
  },
  
  // Tags colors - Black and white palette
  tags: {
    mit: '#000000', // Pure black
    ai: '#374151', // Dark grey
    product: '#6B7280', // Medium grey
    mobile: '#9CA3AF', // Light grey
    engineering: '#000000', // Pure black
    react: '#374151', // Dark grey
    hr: '#6B7280', // Medium grey
    dataScience: '#000000', // Pure black
    design: '#374151', // Dark grey
    ux: '#6B7280' // Medium grey
  }
};

export const MementoSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

export const MementoFontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  xxxxl: 36
};

export const MementoTypography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32
  },
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  }
};

export const MementoBorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 999
};

export const MementoFontWeights = {
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

export const MementoLineHeights = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
};

export const MementoShadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
};
