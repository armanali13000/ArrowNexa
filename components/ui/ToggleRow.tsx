import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { hapticsService } from '../../services/haptics/hapticsService';
import { Text } from './Text';

type Props = {
  title: string;
  subtitle?: string;
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

export const ToggleRow = ({ title, subtitle, enabled, onToggle, disabled }: Props) => {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled }}
      accessibilityLabel={title}
      disabled={disabled}
      onPress={async () => {
        await hapticsService.tap();
        onToggle();
      }}
      style={[styles.row, { opacity: disabled ? 0.45 : 1 }]}
    >
      <View style={styles.copy}>
        <Text variant="body">{title}</Text>
        {subtitle ? <Text variant="caption" color={theme.colors.textSecondary}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.track, { backgroundColor: enabled ? theme.colors.primary : theme.colors.divider }]}>
        <View style={[styles.knob, { backgroundColor: theme.colors.surface, transform: [{ translateX: enabled ? 22 : 2 }] }]} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    minHeight: 58,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  track: {
    width: 52,
    height: 30,
    borderRadius: 999,
    justifyContent: 'center',
  },
  knob: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
});
