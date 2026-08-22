import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppBackground } from '../components/layout/AppBackground';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Card } from '../components/ui/Card';
import { Text } from '../components/ui/Text';
import { calculateTotalStars } from '../services/progression/progressionService';
import { addDays, getLocalDateKey } from '../services/progression/dateService';
import { useProgressStore } from '../store/progress/progressStore';
import { useAppCopy } from '../hooks/useAppCopy';

export default function StatisticsScreen() {
  const progress = useProgressStore();
  const { t } = useAppCopy();
  const completed = Object.keys(progress.completedLevels).length;
  const totalStars = calculateTotalStars(progress.completedLevels);
  const perfect = Object.values(progress.completedLevels).filter((stars) => stars === 3).length;
  const attempts = progress.stats.successfulMoves + progress.stats.blockedTaps;
  const accuracy = attempts ? Math.round((progress.stats.successfulMoves / attempts) * 100) : 100;
  const perfectRate = completed ? Math.round((perfect / completed) * 100) : 0;
  const hintRate = completed ? Math.round((progress.hintsUsed / completed) * 100) : 0;
  const today = getLocalDateKey();
  const activityDays = useMemo(() => Array.from({ length: 30 }, (_, index) => addDays(today, -29 + index)), [today]);
  const thisWeek = activityDays.slice(-7).map((date) => progress.activity[date]).filter(Boolean);
  const previousWeek = activityDays.slice(-14, -7).map((date) => progress.activity[date]).filter(Boolean);
  const thisWeekLevels = thisWeek.reduce((sum, day) => sum + day.levelsCompleted, 0);
  const previousWeekLevels = previousWeek.reduce((sum, day) => sum + day.levelsCompleted, 0);
  const thisWeekStars = thisWeek.reduce((sum, day) => sum + day.starsEarned, 0);
  const insights = [
    thisWeekLevels > 0 ? `${t('You completed')} ${thisWeekLevels} ${t('levels this week.')}` : undefined,
    previousWeek.length && thisWeekLevels > previousWeekLevels ? `${t('You completed')} ${thisWeekLevels - previousWeekLevels} ${t('more levels than last week.')}` : undefined,
    thisWeekStars > 0 ? `${t('You earned')} ${thisWeekStars} ${t('stars this week.')}` : undefined,
    progress.personalRecords.longestNoHintStreak > 0 ? `${t('Your longest no-hint streak is')} ${progress.personalRecords.longestNoHintStreak} ${t('levels.')}` : undefined,
  ].filter(Boolean);

  const overall: Array<[string, string | number]> = [
    [t('Levels Completed'), completed],
    [t('Total Stars'), totalStars],
    [t('Perfect Levels'), perfect],
    [t('Nexa Rank'), progress.nexaRank],
    [t('Total XP'), progress.xp],
    [t('Accuracy'), `${accuracy}%`],
    [t('Perfect Rate'), `${perfectRate}%`],
    [t('Hint Usage'), `${hintRate}%`],
  ];
  const gameplay: Array<[string, string | number]> = [
    [t('Arrows Removed'), progress.totalArrowsCleared],
    [t('Total Moves'), progress.stats.totalMoves],
    [t('Mistakes'), progress.stats.totalMistakes],
    [t('Blocked Taps'), progress.stats.blockedTaps],
    [t('Lives Lost'), progress.stats.totalLivesLost],
    [t('Hints Used'), progress.hintsUsed],
    [t('Undo Used'), progress.stats.undoUsed],
    [t('Boosters Used'), progress.stats.boostersUsed],
  ];
  const records: Array<[string, string | number]> = [
    [t('Fastest Level'), progress.personalRecords.fastestLevelSeconds ? `${progress.personalRecords.fastestLevelSeconds}s` : '-'],
    [t('Longest No-Hint Streak'), progress.personalRecords.longestNoHintStreak],
    [t('Longest Perfect Streak'), progress.personalRecords.longestPerfectStreak],
    [t('Best Daily Streak'), progress.challengeStreak.best],
    [t('Most Stars in Session'), progress.personalRecords.mostStarsInSession],
    [t('Highest Difficulty'), progress.personalRecords.highestDifficultyCompleted ? t(progress.personalRecords.highestDifficultyCompleted) : '-'],
  ];

  return (
    <AppBackground>
      <ScreenHeader title={t('Statistics')} subtitle={t('Local performance dashboard')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title={t('Overall')} stats={overall} />
        <Section title={t('Gameplay')} stats={gameplay} />
        <Section title={t('Difficulty')} stats={[
          [t('Easy Completed'), progress.stats.easyCompleted],
          [t('Normal Completed'), progress.stats.normalCompleted],
          [t('Hard Completed'), progress.stats.hardCompleted],
          [t('Expert Completed'), progress.stats.expertCompleted],
          [t('Daily Complete'), progress.stats.dailyChallengesCompleted],
          [t('Perfect Daily'), progress.stats.perfectDailyChallenges],
        ]} />
        <Section title={t('Personal Bests')} stats={records} />
        <Card style={styles.stack}>
          <Text variant="heading2">{t('Activity')}</Text>
          <View style={styles.activityGrid}>
            {activityDays.map((date) => {
              const day = progress.activity[date];
              const level = !day ? 0 : day.dailyCompleted || day.levelsCompleted > 2 ? 3 : day.levelsCompleted > 0 ? 2 : day.playTimeSeconds > 0 ? 1 : 0;
              return <View key={date} style={[styles.activityCell, styles[`activity${level}` as keyof typeof styles]]} />;
            })}
          </View>
        </Card>
        <Card style={styles.stack}>
          <Text variant="heading2">{t('Your Progress')}</Text>
          {insights.length ? insights.map((insight) => <Text key={insight} variant="bodySmall">{insight}</Text>) : <Text variant="bodySmall">{t('Play a few levels this week to build insights.')}</Text>}
        </Card>
      </ScrollView>
    </AppBackground>
  );
}

const Section = ({ title, stats }: { title: string; stats: Array<[string, string | number]> }) => (
  <Card style={styles.stack}>
    <Text variant="heading2">{title}</Text>
    <View style={styles.grid}>
      {stats.map(([label, value]) => (
        <View key={label} style={styles.stat}>
          <Text variant="caption">{label}</Text>
          <Text variant="title">{value}</Text>
        </View>
      ))}
    </View>
  </Card>
);

const styles = StyleSheet.create({
  content: { padding: 18, gap: 14, paddingBottom: 34 },
  stack: { gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '47%', minHeight: 58, justifyContent: 'space-between' },
  activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  activityCell: { width: 18, height: 18, borderRadius: 4 },
  activity0: { backgroundColor: '#ECEFF1' },
  activity1: { backgroundColor: '#C8E6E4' },
  activity2: { backgroundColor: '#62B6B0' },
  activity3: { backgroundColor: '#1B8A8F' },
});
