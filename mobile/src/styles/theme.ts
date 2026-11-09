// ============================================
// ASRTAVA - Design System Theme
// Premium Enterprise Hospital Management System
// ============================================

export const Colors = {
  // Brand Colors
  primary: '#0F766E',
  primaryLight: '#14B8A6',
  primaryDark: '#0D5E57',
  primaryFaded: '#F0FDFA',

  // Secondary
  secondary: '#1E293B',
  secondaryLight: '#334155',
  secondaryDark: '#0F172A',

  // Accent
  accent: '#F59E0B',
  accentLight: '#FCD34D',
  accentDark: '#D97706',

  // Status
  success: '#22C55E',
  successLight: '#DCFCE7',
  successDark: '#15803D',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningDark: '#B45309',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  errorDark: '#DC2626',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  infoDark: '#2563EB',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderDark: '#CBD5E1',
  divider: '#E2E8F0',

  // Text
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  textLink: '#0F766E',

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowDark: 'rgba(0, 0, 0, 0.16)',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Sidebar
  sidebarBg: '#0F172A',
  sidebarText: '#CBD5E1',
  sidebarActive: '#0F766E',
  sidebarHover: '#1E293B',
} as const;

export const DarkColors = {
  ...Colors,
  background: '#0F172A',
  surface: '#1E293B',
  surfaceVariant: '#334155',
  border: '#334155',
  borderLight: '#1E293B',
  borderDark: '#475569',
  divider: '#334155',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  primaryFaded: '#0D3D38',
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowDark: 'rgba(0, 0, 0, 0.5)',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

export const FontWeight = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const IconSize = {
  xs: 14,
  sm: 16,
  md: 20,
  base: 24,
  lg: 28,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
} as const;

