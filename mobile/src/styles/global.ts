// ============================================
// ASRTAVA - Global Styles
// ============================================

import { StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from './theme';

export const GlobalStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screenPadding: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Cards
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    ...Shadow.md,
  },
  cardCompact: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadow.sm,
  },

  // Typography
  heading1: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  heading2: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  heading3: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  heading4: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  bodyLarge: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  body: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.regular,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  caption: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
    color: Colors.textTertiary,
    lineHeight: 16,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },

  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.md,
  },

  // Sections
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
});

