import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, typography } from '../theme';

// ============================================================
// 1. Header Component
// ============================================================
interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onBack, rightAction }) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerLeft}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightAction && <View style={styles.headerRight}>{rightAction}</View>}
    </View>
  );
};

// ============================================================
// 2. Button Component
// ============================================================
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return colors.border;
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.surfaceSubtle;
      case 'outline':
        return 'transparent';
      case 'danger':
        return colors.danger;
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case 'primary':
      case 'danger':
        return colors.textInverted;
      case 'secondary':
      case 'outline':
        return colors.primary;
      default:
        return colors.textInverted;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.buttonBase,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: variant === 'outline' ? colors.primary : 'transparent',
          borderWidth: variant === 'outline' ? 1.5 : 0,
          paddingVertical: size === 'sm' ? 8 : size === 'lg' ? 15 : 12,
          paddingHorizontal: size === 'sm' ? 12 : 20,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <Text style={[styles.buttonText, { color: getTextColor() }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

// ============================================================
// 3. Card Component
// ============================================================
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress }) => {
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={[styles.card, style]}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
};

// ============================================================
// 4. Badge Component
// ============================================================
interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'primary';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'primary' }) => {
  const getBadgeColors = () => {
    switch (variant) {
      case 'success':
        return { bg: colors.successSurface, text: colors.success };
      case 'warning':
        return { bg: colors.warningSurface, text: colors.warning };
      case 'danger':
        return { bg: colors.dangerSurface, text: colors.danger };
      case 'info':
        return { bg: colors.infoSurface, text: colors.info };
      case 'primary':
      default:
        return { bg: colors.primarySurface, text: colors.primary };
    }
  };

  const c = getBadgeColors();

  return (
    <View style={[styles.badgeContainer, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{label}</Text>
    </View>
  );
};

// ============================================================
// 5. Input Component
// ============================================================
interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  error?: string;
  style?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
}) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        style={[styles.inputField, error ? styles.inputErrorBorder : null]}
      />
      {error && <Text style={styles.inputErrorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  // Header
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  backButtonText: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Button
  buttonBase: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },

  // Card
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginVertical: spacing.sm,
  },

  // Badge
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },

  // Input
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputField: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  inputErrorBorder: {
    borderColor: colors.danger,
  },
  inputErrorText: {
    fontSize: typography.sizes.xs,
    color: colors.danger,
    marginTop: 4,
  },
});

