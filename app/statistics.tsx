import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppBackground } from '../components/layout/AppBackground';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Card } from '../components/ui/Card';
import { Text } from '../components/ui/Text';
import { calculateTotalStars } from '../services/progression/progressionService';
import { addDays, getLocalDateKey } from '../services/progression/dateService';
import { useProgressStore } from '../store/progress/progressStore';

export default function StatisticsScreen() {
  const progress = useProgressStore();
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
    thisWeekLevels > 0 ? `You completed ${thisWeekLevels} levels this week.` : undefined,
    previousWeek.length && thisWeekLevels > previousWeekLevels ? `You completed ${thisWeekLevels - previousWeekLevels} more levels than last week.` : undefined,
    thisWeekStars > 0 ? `You earned ${thisWeekStars} stars this week.` : undefined,
    progress.personalRecords.longestNoHintStreak > 0 ? `Your longest no-hint streak is ${progress.personalRecords.longestNoHintStreak} levels.` : undefined,
  ].filter(Boolean);

  const overall: Array<[string, string | number]> = [
    ['Levels Completed', completed],
    ['Total Stars', totalStars],
    ['Perfect Levels', perfect],
    ['Nexa Rank', progress.nexaRank],
    ['Total XP', progress.xp],
    ['Accuracy', `${accuracy}%`],
    ['Perfect Rate', `${perfectRate}%`],
    ['Hint Usage', `${hintRate}%`],
  ];
  const gameplay: Array<[string, string | number]> = [
    ['Arrows Removed', progress.totalArrowsCleared],
    ['Total Moves', progress.stats.totalMoves],
    ['Mistakes', progress.stats.totalMistakes],
    ['Blocked Taps', progress.stats.blockedTaps],
    ['Lives Lost', progress.stats.totalLivesLost],
    ['Hints Used', progress.hintsUsed],
    ['Undo Used', progress.stats.undoUsed],
    ['Boosters Used', progress.stats.boostersUsed],
  ];
  const records: Array<[string, string | number]> = [
    ['Fastest Level', progress.personalRecords.fastestLevelSeconds ? `${progress.personalRecords.fastestLevelSeconds}s` : '-'],
    ['Longest No-Hint Streak', progress.personalRecords.longestNoHintStreak],
    ['Longest Perfect Streak', progress.personalRecords.longestPerfectStreak],
    ['Best Daily Streak', progress.challengeStreak.best],
    ['Most Stars in Session', progress.personalRecords.mostStarsInSession],
    ['Highest Difficulty', progress.personalRecords.highestDifficultyCompleted ?? '-'],
  ];

  return (
    <AppBackground>
      <ScreenHeader title="Statistics" subtitle="Local performance dashboard" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="Overall" stats={overall} />
        <Section title="Gameplay" stats={gameplay} />
        <Section title="Difficulty" stats={[
          ['Easy Completed', progress.stats.easyCompleted],
          ['Normal Completed', progress.stats.normalCompleted],
          ['Hard Completed', progress.stats.hardCompleted],
          ['Expert Completed', progress.stats.expertCompleted],
          ['Daily Complete', progress.stats.dailyChallengesCompleted],
          ['Perfect Daily', progress.stats.perfectDailyChallenges],
        ]} />
        <Section title="Personal Bests" stats={records} />
        <Card style={styles.stack}>
          <Text variant="heading2">Activity</Text>
          <View style={styles.activityGrid}>
            {activityDays.map((date) => {
              const day = progress.activity[date];
              const level = !day ? 0 : day.dailyCompleted || day.levelsCompleted > 2 ? 3 : day.levelsCompleted > 0 ? 2 : day.playTimeSeconds > 0 ? 1 : 0;
              return <View key={date} style={[styles.activityCell, styles[`activity${level}` as keyof typeof styles]]} />;
            })}
          </View>
        </Card>
        <Card style={styles.stack}>
          <Text variant="heading2">Your Progress</Text>
          {insights.length ? insights.map((insight) => <Text key={insight} variant="bodySmall">{insight}</Text>) : <Text variant="bodySmall">Play a few levels this week to build insights.</Text>}
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
