export const MementoColors = {
  // Enhanced professional color palette
  primary: '#0891B2', // Professional cyan
  primaryLight: '#22D3EE', // Light cyan
  primaryDark: '#0E7490', // Dark cyan
  secondary: '#64748B', // Sophisticated slate
  tertiary: '#8B5CF6', // Elegant purple accent
  
  // Background colors - Clean whites and greys
  background: '#FFFFFF', // Pure white
  backgroundSecondary: '#F9FAFB', // Very light grey
  backgroundCard: '#FFFFFF', // White cards
  backgroundSidebar: '#F8F9FA', // Light grey sidebar
  backgroundGradient: ['#FFFFFF', '#F9FAFB'], // Subtle gradient
  
  // Text colors - Professional blacks
  textPrimary: '#000000', // Pure black
  textSecondary: '#374151', // Dark grey
  textTertiary: '#6B7280', // Medium grey
  textMuted: '#9CA3AF', // Light grey
  
  // Border colors - Clean and minimal
  border: '#E5E7EB', // Light grey border
  borderLight: '#F3F4F6', // Very light border
  borderMedium: '#D1D5DB', // Medium border
  borderDark: '#6B7280', // Dark grey border
  
  // Status colors - Enhanced professional palette
  success: '#10B981', // Vibrant green
  warning: '#F59E0B', // Warm amber
  error: '#EF4444', // Clear red
  info: '#0891B2', // Professional cyan
  
  // Accent colors - Minimal and professional
  accent: '#0891B2', // Subtle professional cyan
  accentLight: '#22D3EE', // Light cyan
  
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
  
  // Stats colors - All the same color for consistency
  stats: {
    contacts: '#374151', // Dark grey
    encounters: '#374151', // Dark grey
    thisWeek: '#374151', // Dark grey
    notes: '#374151' // Dark grey
  },
  
  // Tags colors - Dark grey for professional look
  tags: {
    mit: '#374151', // Dark grey
    ai: '#374151', // Dark grey
    product: '#374151', // Dark grey
    mobile: '#374151', // Dark grey
    engineering: '#374151', // Dark grey
    react: '#374151', // Dark grey
    hr: '#374151', // Dark grey
    dataScience: '#374151', // Dark grey
    design: '#374151', // Dark grey
    ux: '#374151' // Dark grey
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
