import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Difficulty } from '../../engine/types/game';
import { useTheme } from '../../hooks/useTheme';
import { Text } from './Text';

const colors: Record<Difficulty, string> = {
  Easy: '#2EA86F',
  Normal: '#1B8A8F',
  Hard: '#D88920',
  Expert: '#D9514E',
};

export const DifficultyBadge = ({ difficulty }: { difficulty: Difficulty }) => {
  const theme = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: colors[difficulty] }]}>
      <Text variant="caption" color="#FFFFFF" style={{ fontWeight: theme.typography.caption.fontWeight }}>{difficulty}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
