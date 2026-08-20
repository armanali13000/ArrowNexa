import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppBackground } from '../components/layout/AppBackground';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Text } from '../components/ui/Text';
import { achievementCatalog } from '../constants/achievements';
import { useTheme } from '../hooks/useTheme';
import { useProgressStore } from '../store/progress/progressStore';

export default function AchievementsScreen() {
  const theme = useTheme();
  const progressMap = useProgressStore((state) => state.achievements);

  return (
    <AppBackground>
      <ScreenHeader title="Achievements" subtitle="Milestones prepared for Phase 2" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {achievementCatalog.map((achievement) => {
          const stored = progressMap[achievement.id];
          const value = stored?.progress ?? achievement.progress;
          const unlocked = stored?.unlocked ?? achievement.unlocked;
          return (
            <Card key={achievement.id} style={styles.card}>
              <View style={[styles.icon, { backgroundColor: unlocked ? theme.colors.primary : theme.colors.boardBackground }]}>
                <Text variant="caption" color={unlocked ? '#FFFFFF' : theme.colors.textSecondary}>{achievement.icon}</Text>
              </View>
              <View style={styles.achievementCopy}>
                <Text variant="title">{achievement.title}</Text>
                <Text variant="bodySmall" color={theme.colors.textSecondary}>{achievement.description}</Text>
                <ProgressBar value={value / achievement.target} />
                <Text variant="caption" color={theme.colors.textSecondary}>{value} / {achievement.target}</Text>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    gap: 12,
    paddingBottom: 34,
  },
  card: {
    flexDirection: 'row',
    gap: 14,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementCopy: {
    flex: 1,
    gap: 8,
  },
});
