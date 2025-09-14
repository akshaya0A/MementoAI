export const MementoColors = {
  // Professional neutral color palette
  primary: '#2563EB', // Professional blue
  primaryLight: '#3B82F6', // Light blue
  primaryDark: '#1D4ED8', // Dark blue
  secondary: '#374151', // Sophisticated slate
  tertiary: '#059669', // Professional green accent
  
  // Background colors - Clean whites and greys
  background: '#FFFFFF', // Pure white
  backgroundSecondary: '#F8FAFC', // Very light grey
  backgroundCard: '#FFFFFF', // White cards
  backgroundSidebar: '#F1F5F9', // Light grey sidebar
  backgroundGradient: ['#FFFFFF', '#F8FAFC'], // Subtle gradient
  
  // Text colors - Professional blacks and greys
  textPrimary: '#0F172A', // Very dark slate
  textSecondary: '#334155', // Dark slate
  textTertiary: '#64748B', // Medium slate
  textMuted: '#94A3B8', // Light slate
  
  // Border colors - Clean and minimal
  border: '#E2E8F0', // Light slate border
  borderLight: '#F1F5F9', // Very light border
  borderMedium: '#CBD5E1', // Medium border
  borderDark: '#64748B', // Dark slate border
  
  // Status colors - Professional palette
  success: '#059669', // Professional green
  warning: '#D97706', // Professional amber
  error: '#DC2626', // Professional red
  info: '#0EA5E9', // Professional blue
  
  // Accent colors - Minimal and professional
  accent: '#2563EB', // Professional blue accent
  accentLight: '#3B82F6', // Light blue
  
  // Legacy support for existing components
  text: {
    primary: '#0F172A', // Very dark slate
    secondary: '#334155', // Dark slate
    muted: '#64748B', // Medium slate
    white: '#FFFFFF' // White
  },
  
  border: {
    light: '#F1F5F9', // Very light border
    medium: '#CBD5E1', // Medium border
    dark: '#64748B' // Dark slate border
  },
  
  // Stats colors - Consistent professional palette
  stats: {
    contacts: '#2563EB', // Professional blue
    encounters: '#059669', // Professional green
    thisWeek: '#0EA5E9', // Professional blue
    notes: '#D97706' // Professional amber
  },
  
  // Tags colors - Subtle professional palette
  tags: {
    mit: '#2563EB', // Professional blue
    ai: '#059669', // Professional green
    product: '#0EA5E9', // Professional blue
    mobile: '#D97706', // Professional amber
    engineering: '#2563EB', // Professional blue
    react: '#059669', // Professional green
    hr: '#0EA5E9', // Professional blue
    dataScience: '#2563EB', // Professional blue
    design: '#D97706', // Professional amber
    ux: '#2563EB' // Professional blue
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
