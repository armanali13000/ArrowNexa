import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type Props = {
  value: number;
};

export const ProgressBar = ({ value }: Props) => {
  const theme = useTheme();
  const width = `${Math.max(0, Math.min(1, value)) * 100}%` as const;
  return (
    <View style={[styles.track, { backgroundColor: theme.colors.divider }]}>
      <View style={[styles.fill, { width, backgroundColor: theme.colors.primary }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 9,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
