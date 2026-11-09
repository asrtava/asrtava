export const colors = {
  // Brand Teal Identity
  primary: '#0F766E', // Teal 700
  primaryLight: '#14B8A6', // Teal 500
  primaryDark: '#115E59', // Teal 800
  primarySurface: '#F0FDFA', // Teal 50
  primaryBorder: '#CCFBF1', // Teal 100

  // Secondary Accents
  accent: '#0284C7', // Sky 600
  accentLight: '#E0F2FE', // Sky 100
  purple: '#7C3AED',
  purpleSurface: '#F5F3FF',

  // Status & Clinical Flags
  success: '#16A34A', // Green 600
  successSurface: '#F0FDF4',
  warning: '#D97706', // Amber 600
  warningSurface: '#FFFBEB',
  danger: '#DC2626', // Red 600
  dangerSurface: '#FEF2F2',
  info: '#2563EB',
  infoSurface: '#EFF6FF',

  // Neutrals & Surface
  background: '#F8FAFC', // Slate 50
  card: '#FFFFFF',
  surfaceSubtle: '#F1F5F9', // Slate 100
  border: '#E2E8F0', // Slate 200
  borderStrong: '#CBD5E1', // Slate 300

  // Text Hierarchies
  textPrimary: '#0F172A', // Slate 900
  textSecondary: '#475569', // Slate 600
  textMuted: '#94A3B8', // Slate 400
  textInverted: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  huge: 32,
};

export const typography = {
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    title: 28,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

