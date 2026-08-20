import React, { ReactNode, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Text } from './Text';
import { useTheme } from '../../hooks/useTheme';
import { audioService } from '../../services/audio/audioService';
import { hapticsService } from '../../services/haptics/hapticsService';
import { useSettingsStore } from '../../store/settings/settingsStore';

type Variant = 'primary' | 'secondary' | 'ghost' | 'tool';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export const Button = ({ title, onPress, variant = 'primary', disabled, loading, icon, accessibilityLabel, style }: Props) => {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const palette = useMemo(() => {
    if (variant === 'primary') return { backgroundColor: theme.colors.primary, color: '#FFFFFF', borderColor: theme.colors.primary };
    if (variant === 'secondary') return { backgroundColor: theme.colors.secondary, color: '#FFFFFF', borderColor: theme.colors.secondary };
    if (variant === 'tool') return { backgroundColor: theme.colors.surface, color: theme.colors.textPrimary, borderColor: theme.colors.divider };
    return { backgroundColor: 'transparent', color: theme.colors.primary, borderColor: theme.colors.divider };
  }, [theme, variant]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        disabled={disabled || loading}
        onPressIn={() => {
          if (useSettingsStore.getState().animationsEnabled) scale.value = withTiming(0.97, { duration: 65 });
        }}
        onPressOut={() => {
          if (useSettingsStore.getState().animationsEnabled) scale.value = withTiming(1, { duration: 105 });
        }}
        onPress={async () => {
          await Promise.all([hapticsService.button(), audioService.buttonClick()]);
          onPress?.();
        }}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor, opacity: disabled ? 0.48 : pressed ? 0.86 : 1 },
          variant === 'tool' && styles.tool,
        ]}
      >
        {loading ? <ActivityIndicator color={palette.color} /> : <View style={styles.content}>{icon}<Text variant="button" color={palette.color}>{title}</Text></View>}
      </Pressable>
    </Animated.View>
  );
};

export const PrimaryButton = (props: Omit<Props, 'variant'>) => <Button {...props} variant="primary" />;
export const SecondaryButton = (props: Omit<Props, 'variant'>) => <Button {...props} variant="secondary" />;
export const GameToolButton = (props: Omit<Props, 'variant'>) => <Button {...props} variant="tool" />;

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  tool: {
    flex: 1,
    minHeight: 58,
  },
});
