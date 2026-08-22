import React, { useEffect } from 'react';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppState, StyleSheet } from 'react-native';
import { useAppBootstrap } from '../hooks/useAppBootstrap';
import { useTheme } from '../hooks/useTheme';
import { SplashScreenView } from '../components/layout/SplashScreenView';
import { audioService } from '../services/audio/audioService';
import { ErrorBoundary } from '../components/layout/ErrorBoundary';
import { reminderService } from '../services/notifications/reminderService';

export default function RootLayout() {
  const ready = useAppBootstrap();
  const theme = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    audioService.initialize().catch(() => undefined);
    const removeNotificationTapListener = reminderService.handleNotificationTap();
    reminderService.requestPermissionOnFirstLaunch().then(() => reminderService.syncFromPreferences()).catch(() => undefined);
    const subscription = AppState.addEventListener('change', (state) => {
      audioService.setActive(state === 'active').catch(() => undefined);
      if (state === 'background') reminderService.syncFromPreferences().catch(() => undefined);
    });
    return () => {
      removeNotificationTapListener();
      subscription.remove();
      audioService.stopMusic().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    audioService.startMusic(pathname === '/game' ? 'gameplayMusic' : 'menuMusic').catch(() => undefined);
  }, [pathname, ready]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
        <StatusBar style={theme.colors.background === '#10151A' ? 'light' : 'dark'} />
        {ready ? (
          <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }} />
        ) : (
          <SplashScreenView />
        )}
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
