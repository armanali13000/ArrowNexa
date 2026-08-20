import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
};

export const AppBackground = ({ children }: Props) => {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.bandOne, { backgroundColor: theme.colors.primary }]} />
      <View style={[styles.bandTwo, { backgroundColor: theme.colors.accent }]} />
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    overflow: 'hidden',
  },
  bandOne: {
    position: 'absolute',
    width: '130%',
    height: 90,
    opacity: 0.1,
    top: 18,
    left: -40,
    transform: [{ rotate: '-10deg' }],
  },
  bandTwo: {
    position: 'absolute',
    width: '120%',
    height: 76,
    opacity: 0.12,
    bottom: 30,
    left: -30,
    transform: [{ rotate: '8deg' }],
  },
});
