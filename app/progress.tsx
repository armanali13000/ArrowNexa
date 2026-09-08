import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppBackground } from '../components/layout/AppBackground';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { BadgeTile, GamePanel } from '../components/ui/GamePanel';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Text } from '../components/ui/Text';
import { useProgressStore } from '../store/progress/progressStore';
import { calculateTotalStars } from '../services/progression/progressionService';
import { xpRequiredForRank } from '../services/progression/xpService';
import { createLevelMetadata } from '../engine/levels/levelFactory';
import { useAppCopy } from '../hooks/useAppCopy';

export default function ProgressScreen() {
  const progress = useProgressStore();
  const { copy, t } = useAppCopy();
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
      <ScreenHeader title={copy.progress} subtitle={t('Nexa Rank and collection')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GamePanel title={`${copy.nexaRank} ${progress.nexaRank}`} eyebrow={t('PLAYER PROGRESS')} accent="#38BDF8" style={styles.hero}>
          <Text variant="bodySmall">{progress.xp} / {xpRequiredForRank(progress.nexaRank)} XP</Text>
          <ProgressBar value={progress.xp / xpRequiredForRank(progress.nexaRank)} />
        </GamePanel>
        <View style={styles.grid}>
          <BadgeTile icon=">" label={t('Puzzle Level')} value={progress.currentLevel} />
          <BadgeTile icon="*" label={t('Total Stars')} value={`${totalStars}/1500`} accent="#FFB84D" />
          <BadgeTile icon="#" label={t('Chapters Complete')} value={progress.completedChapters.length} accent="#A855F7" />
          <BadgeTile icon="+" label={t('Levels Complete')} value={completed} accent="#22D3EE" />
          <BadgeTile icon="*" label={t('Perfect Levels')} value={perfect} accent="#FFB84D" />
          <BadgeTile icon="^" label={t('Current Streak')} value={progress.dailyReward.currentStreak} accent="#38BDF8" />
          <BadgeTile icon="!" label={t('Best Streak')} value={progress.dailyReward.bestStreak} accent="#A855F7" />
        </View>
        <GamePanel title={t('Difficulty Completion')} accent="#FFB84D">
          {Object.entries(difficultyCounts).map(([difficulty, value]) => <Text key={difficulty} variant="body">{t(difficulty)}: {value}</Text>)}
        </GamePanel>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, gap: 14, paddingBottom: 34 },
  hero: { minHeight: 150 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
