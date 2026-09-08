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
    if (variant === 'primary') return { backgroundColor: '#1498E5', color: '#FFFFFF', borderColor: '#7DD3FC' };
    if (variant === 'secondary') return { backgroundColor: '#1B2A6B', color: '#FFFFFF', borderColor: '#38BDF8' };
    if (variant === 'tool') return { backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFFFFF', borderColor: 'rgba(125,211,252,0.25)' };
    return { backgroundColor: 'transparent', color: '#7DD3FC', borderColor: 'rgba(125,211,252,0.24)' };
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
        onPress={() => {
          void Promise.all([hapticsService.button(), audioService.buttonClick()]).catch(() => undefined);
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
    borderRadius: 8,
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
