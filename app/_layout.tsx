import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useAppBootstrap } from '../hooks/useAppBootstrap';
import { useTheme } from '../hooks/useTheme';
import { SplashScreenView } from '../components/layout/SplashScreenView';
import { audioService } from '../services/audio/audioService';

export default function RootLayout() {
  const ready = useAppBootstrap();
  const theme = useTheme();

  useEffect(() => {
    audioService.initialize().catch(() => undefined);
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style={theme.colors.background === '#10151A' ? 'light' : 'dark'} />
      {ready ? (
        <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }} />
      ) : (
        <SplashScreenView />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
