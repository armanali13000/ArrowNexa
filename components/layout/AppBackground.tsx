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
      <View style={styles.routeGrid} />
      <View style={[styles.bandOne, { backgroundColor: theme.colors.primary }]} />
      <View style={[styles.bandTwo, { backgroundColor: theme.colors.accent }]} />
      <View style={styles.pathLine} />
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    overflow: 'hidden',
  },
  routeGrid: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#061344',
  },
  bandOne: {
    position: 'absolute',
    width: '130%',
    height: 90,
    opacity: 0.24,
    top: 18,
    left: -40,
    transform: [{ rotate: '-10deg' }],
  },
  bandTwo: {
    position: 'absolute',
    width: '120%',
    height: 76,
    opacity: 0.22,
    bottom: 30,
    left: -30,
    transform: [{ rotate: '8deg' }],
  },
  pathLine: {
    position: 'absolute',
    width: '88%',
    height: '62%',
    left: '6%',
    top: '16%',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.16)',
    borderRadius: 8,
    transform: [{ rotate: '-7deg' }],
  },
});
