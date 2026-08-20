import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppBackground } from '../components/layout/AppBackground';
import { BrandLogo } from '../components/ui/BrandLogo';
import { Button, PrimaryButton, SecondaryButton } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { BoltIcon, StarIcon } from '../components/ui/Icons';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Text } from '../components/ui/Text';
import { TOTAL_LEVELS } from '../constants/levels';
import { useTheme } from '../hooks/useTheme';
import { useProgressStore } from '../store/progress/progressStore';

const menu = [
  { title: 'Levels', route: '/levels' },
  { title: 'Daily Challenge', route: null },
  { title: 'Achievements', route: '/achievements' },
  { title: 'Statistics', route: '/statistics' },
  { title: 'How to Play', route: '/tutorial' },
  { title: 'Settings', route: '/settings' },
] as const;

export default function HomeScreen() {
  const theme = useTheme();
  const currentLevel = useProgressStore((state) => state.currentLevel);
  const stars = useProgressStore((state) => state.stars);
  const hints = useProgressStore((state) => state.hints);

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(260)} style={styles.brand}>
          <BrandLogo />
          <View style={styles.brandCopy}>
            <Text variant="display">ArrowNexa</Text>
            <Text variant="title" color={theme.colors.textSecondary}>Find the Way Out</Text>
            <Text variant="caption" color={theme.colors.textSecondary}>Armanix Studio</Text>
          </View>
        </Animated.View>

        <Card>
          <View style={styles.row}>
            <View>
              <Text variant="caption" color={theme.colors.textSecondary}>Current Level</Text>
              <Text variant="heading1">Level {currentLevel}</Text>
            </View>
            <View style={styles.wallet}>
              <View style={styles.walletItem}><StarIcon color={theme.colors.accent} /><Text variant="title">{stars}</Text></View>
              <View style={styles.walletItem}><BoltIcon color={theme.colors.primary} /><Text variant="title">{hints}</Text></View>
            </View>
          </View>
          <View style={styles.progressCopy}>
            <Text variant="bodySmall" color={theme.colors.textSecondary}>Difficulty: Normal</Text>
            <Text variant="bodySmall" color={theme.colors.textSecondary}>Progress: {currentLevel} / {TOTAL_LEVELS}</Text>
          </View>
          <ProgressBar value={currentLevel / TOTAL_LEVELS} />
        </Card>

        <PrimaryButton title="PLAY" accessibilityLabel="Play latest unlocked level" onPress={() => router.push('/game')} style={styles.play} />

        <View style={styles.menuGrid}>
          {menu.map((item) => (
            <SecondaryButton
              key={item.title}
              title={item.route ? item.title : 'Daily Challenge  Coming Soon'}
              onPress={() => item.route && router.push(item.route)}
              disabled={!item.route}
              style={styles.menuButton}
            />
          ))}
        </View>
        <Button title="About ArrowNexa" variant="ghost" onPress={() => router.push('/about')} />
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 34,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 12,
  },
  brandCopy: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  wallet: {
    gap: 8,
    alignItems: 'flex-end',
  },
  walletItem: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  progressCopy: {
    marginTop: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  play: {
    minHeight: 64,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  menuButton: {
    width: '48%',
  },
});
