import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppBackground } from '../components/layout/AppBackground';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Text } from '../components/ui/Text';
import { useProgressStore } from '../store/progress/progressStore';
import { calculateTotalStars } from '../services/progression/progressionService';
import { xpRequiredForRank } from '../services/progression/xpService';
import { createLevelMetadata } from '../engine/levels/levelFactory';

export default function ProgressScreen() {
  const progress = useProgressStore();
  const totalStars = calculateTotalStars(progress.completedLevels);
  const completed = Object.keys(progress.completedLevels).length;
  const perfect = Object.values(progress.completedLevels).filter((stars) => stars === 3).length;
  const difficultyCounts = Object.keys(progress.completedLevels).reduce<Record<string, number>>((counts, level) => {
    const difficulty = createLevelMetadata(Number(level)).difficulty;
    counts[difficulty] = (counts[difficulty] ?? 0) + 1;
    return counts;
  }, { Easy: 0, Normal: 0, Hard: 0, Expert: 0 });

  return (
    <AppBackground>
      <ScreenHeader title="Progress" subtitle="Nexa Rank and collection" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.stack}>
          <Text variant="heading2">Nexa Rank {progress.nexaRank}</Text>
          <Text variant="bodySmall">{progress.xp} / {xpRequiredForRank(progress.nexaRank)} XP</Text>
          <ProgressBar value={progress.xp / xpRequiredForRank(progress.nexaRank)} />
        </Card>
        <View style={styles.grid}>
          <Stat label="Puzzle Level" value={progress.currentLevel} />
          <Stat label="Total Stars" value={`${totalStars}/1500`} />
          <Stat label="Chapters Complete" value={progress.completedChapters.length} />
          <Stat label="Levels Complete" value={completed} />
          <Stat label="Perfect Levels" value={perfect} />
          <Stat label="Current Streak" value={progress.dailyReward.currentStreak} />
          <Stat label="Best Streak" value={progress.dailyReward.bestStreak} />
        </View>
        <Card style={styles.stack}>
          <Text variant="heading2">Difficulty Completion</Text>
          {Object.entries(difficultyCounts).map(([difficulty, value]) => <Text key={difficulty} variant="body">{difficulty}: {value}</Text>)}
        </Card>
      </ScrollView>
    </AppBackground>
  );
}

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <Card style={styles.stat}>
    <Text variant="caption">{label}</Text>
    <Text variant="heading2">{value}</Text>
  </Card>
);

const styles = StyleSheet.create({
  content: { padding: 18, gap: 14, paddingBottom: 34 },
  stack: { gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: { width: '48%', minHeight: 110, justifyContent: 'space-between' },
});
