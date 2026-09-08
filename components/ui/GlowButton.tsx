// Powered by OnSpace.AI
import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
}

export function GlowButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
  size = 'md',
}: Props) {
  const bgColor =
    variant === 'primary'
      ? Colors.primaryGlow
      : variant === 'danger'
      ? 'rgba(255,68,68,0.15)'
      : Colors.surfaceElevated;

  const borderColor =
    variant === 'primary'
      ? Colors.primary
      : variant === 'danger'
      ? Colors.error
      : Colors.surfaceBorder;

  const labelColor =
    variant === 'primary'
      ? Colors.primary
      : variant === 'danger'
      ? Colors.error
      : Colors.textSecondary;

  const paddingV = size === 'sm' ? Spacing.xs : size === 'lg' ? Spacing.md : Spacing.sm;
  const paddingH = size === 'sm' ? Spacing.sm : size === 'lg' ? Spacing.lg : Spacing.md;
  const fontSize = size === 'sm' ? FontSize.xs : size === 'lg' ? FontSize.md : FontSize.sm;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bgColor,
          borderColor,
          paddingVertical: paddingV,
          paddingHorizontal: paddingH,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.label, { color: labelColor, fontSize }, textStyle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
