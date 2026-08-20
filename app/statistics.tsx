import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppBackground } from '../components/layout/AppBackground';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Card } from '../components/ui/Card';
import { Text } from '../components/ui/Text';
import { useProgressStore } from '../store/progress/progressStore';

export default function StatisticsScreen() {
  const progress = useProgressStore();
  const completed = Object.keys(progress.completedLevels).length;
  const perfect = Object.values(progress.completedLevels).filter((stars) => stars === 3).length;
  const stats = [
    ['Levels Completed', completed],
    ['Perfect Levels', perfect],
    ['Total Arrows Cleared', progress.totalArrowsCleared],
    ['Hints Used', progress.hintsUsed],
    ['Current Streak', progress.streak],
    ['Best Streak', progress.bestStreak],
    ['Total Play Time', `${Math.floor(progress.totalPlayTimeSeconds / 60)}m`],
    ['Easy Completed', completed],
    ['Normal Completed', 0],
    ['Hard Completed', 0],
    ['Expert Completed', 0],
  ];

  return (
    <AppBackground>
      <ScreenHeader title="Statistics" subtitle="Local dashboard foundation" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {stats.map(([label, value]) => (
            <Card key={label} style={styles.stat}>
              <Text variant="caption">{label}</Text>
              <Text variant="heading1">{value}</Text>
            </Card>
          ))}
        </View>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    paddingBottom: 34,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  stat: {
    width: '48%',
    minHeight: 118,
    justifyContent: 'space-between',
  },
});
