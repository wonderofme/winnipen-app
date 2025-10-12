// Winnipeg-Themed Design System
// Inspired by Winnipeg Jets colors and prairie landscape

export const WINNIPEG_COLORS = {
  // Primary Jets Colors
  jetsNavy: '#041E42',      // Primary background/headers
  jetsBlue: '#243959',      // Primary actions/buttons
  jetsWhite: '#FFFFFF',     // Text on dark backgrounds
  jetsGold: '#C5A05C',      // Accent/highlight color
  
  // Prairie-inspired colors
  prairieBeige: '#F5F1E8',  // Light background
  prairieBrown: '#8B7355',  // Secondary text
  prairieGreen: '#6B8E23',  // Success states
  
  // Neutral colors
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827'
  },
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6'
};

export const WINNIPEG_TYPOGRAPHY = {
  // Font weights
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  
  // Font sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  
  // Line heights
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75
};

export const WINNIPEG_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64
};

export const WINNIPEG_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999
};

export const WINNIPEG_SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8
  }
};

// Winnipeg-specific constants
export const WINNIPEG_NEIGHBORHOODS = [
  'The Forks',
  'Exchange District',
  'Osborne Village',
  'St. Boniface',
  'Corydon Village',
  'Wolseley',
  'West End',
  'North End',
  'East Kildonan',
  'West Kildonan',
  'River Heights',
  'Tuxedo',
  'Charleswood',
  'St. James',
  'St. Vital',
  'Fort Rouge',
  'Downtown Winnipeg',
  'Peguis',
  'Point Douglas',
  'Elmwood'
];

export const WINNIPEG_TERMS = {
  residents: 'Winnipeggers',
  city: 'The Peg',
  winter: 'Winterpeg',
  community: 'Winnipeg Community',
  welcome: 'Welcome to Winnipeg\'s Community'
};

// Helper functions
export const getNeighborhoodFromCoords = (latitude, longitude) => {
  // Simplified neighborhood detection based on coordinates
  // In a real app, you'd use a proper geocoding service
  
  if (latitude >= 49.89 && latitude <= 49.90 && longitude >= -97.15 && longitude <= -97.12) {
    return 'The Forks';
  } else if (latitude >= 49.89 && latitude <= 49.90 && longitude >= -97.14 && longitude <= -97.12) {
    return 'Exchange District';
  } else if (latitude >= 49.88 && latitude <= 49.89 && longitude >= -97.16 && longitude <= -97.14) {
    return 'St. Boniface';
  } else if (latitude >= 49.88 && latitude <= 49.89 && longitude >= -97.18 && longitude <= -97.16) {
    return 'Osborne Village';
  } else if (latitude >= 49.90 && latitude <= 49.92 && longitude >= -97.20 && longitude <= -97.18) {
    return 'Wolseley';
  } else if (latitude >= 49.90 && latitude <= 49.92 && longitude >= -97.18 && longitude <= -97.16) {
    return 'River Heights';
  } else if (latitude >= 49.88 && latitude <= 49.90 && longitude >= -97.12 && longitude <= -97.10) {
    return 'Downtown Winnipeg';
  }
  
  return 'Winnipeg';
};

export const formatWinnipegLocation = (coordinates) => {
  const neighborhood = getNeighborhoodFromCoords(coordinates.latitude, coordinates.longitude);
  return `Posted in ${neighborhood}`;
};

// Common component styles
export const WINNIPEG_STYLES = {
  // Button styles
  primaryButton: {
    backgroundColor: WINNIPEG_COLORS.jetsBlue,
    borderRadius: WINNIPEG_RADIUS.lg,
    paddingVertical: WINNIPEG_SPACING.md,
    paddingHorizontal: WINNIPEG_SPACING.xl,
    ...WINNIPEG_SHADOWS.md
  },
  
  secondaryButton: {
    backgroundColor: WINNIPEG_COLORS.jetsWhite,
    borderColor: WINNIPEG_COLORS.jetsBlue,
    borderWidth: 2,
    borderRadius: WINNIPEG_RADIUS.lg,
    paddingVertical: WINNIPEG_SPACING.md,
    paddingHorizontal: WINNIPEG_SPACING.xl
  },
  
  // Card styles
  card: {
    backgroundColor: WINNIPEG_COLORS.jetsWhite,
    borderRadius: WINNIPEG_RADIUS.lg,
    padding: WINNIPEG_SPACING.lg,
    ...WINNIPEG_SHADOWS.md,
    borderLeftWidth: 4,
    borderLeftColor: WINNIPEG_COLORS.jetsBlue
  },
  
  // Header styles
  header: {
    backgroundColor: WINNIPEG_COLORS.jetsNavy,
    paddingVertical: WINNIPEG_SPACING.lg,
    paddingHorizontal: WINNIPEG_SPACING.lg
  },
  
  // Text styles
  heading: {
    fontSize: WINNIPEG_TYPOGRAPHY['2xl'],
    fontWeight: WINNIPEG_TYPOGRAPHY.bold,
    color: WINNIPEG_COLORS.jetsNavy,
    lineHeight: WINNIPEG_TYPOGRAPHY['2xl'] * WINNIPEG_TYPOGRAPHY.tight
  },
  
  subheading: {
    fontSize: WINNIPEG_TYPOGRAPHY.lg,
    fontWeight: WINNIPEG_TYPOGRAPHY.semibold,
    color: WINNIPEG_COLORS.jetsNavy,
    lineHeight: WINNIPEG_TYPOGRAPHY.lg * WINNIPEG_TYPOGRAPHY.normal
  },
  
  body: {
    fontSize: WINNIPEG_TYPOGRAPHY.base,
    fontWeight: WINNIPEG_TYPOGRAPHY.regular,
    color: WINNIPEG_COLORS.gray[700],
    lineHeight: WINNIPEG_TYPOGRAPHY.base * WINNIPEG_TYPOGRAPHY.normal
  },
  
  caption: {
    fontSize: WINNIPEG_TYPOGRAPHY.sm,
    fontWeight: WINNIPEG_TYPOGRAPHY.regular,
    color: WINNIPEG_COLORS.gray[500],
    lineHeight: WINNIPEG_TYPOGRAPHY.sm * WINNIPEG_TYPOGRAPHY.normal
  }
};
