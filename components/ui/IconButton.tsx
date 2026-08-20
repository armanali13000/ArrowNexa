import React, { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { hapticsService } from '../../services/haptics/hapticsService';

type Props = {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
};

export const IconButton = ({ icon, label, onPress }: Props) => {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={async () => {
        await hapticsService.tap();
        onPress?.();
      }}
      style={({ pressed }) => [styles.button, { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider, opacity: pressed ? 0.72 : 1 }]}
    >
      {icon}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
