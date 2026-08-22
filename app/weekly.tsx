import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppBackground } from '../components/layout/AppBackground';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Text } from '../components/ui/Text';
import { getWeekId } from '../services/progression/dateService';
import { ensureWeeklyChallenge } from '../services/progression/weeklyChallengeService';
import { useProgressStore } from '../store/progress/progressStore';
import { useAppCopy } from '../hooks/useAppCopy';

export default function WeeklyScreen() {
  const progress = useProgressStore();
  const { t } = useAppCopy();
  const weekly = ensureWeeklyChallenge(progress, getWeekId());
  const complete = weekly.objectives.every((objective) => objective.completed);

  return (
    <AppBackground>
      <ScreenHeader title={t('Weekly Goals')} subtitle={`${weekly.weekId || getWeekId()} - ${t('Monday reset')}`} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.stack}>
          <Text variant="heading2">{complete ? t('Reward Ready') : t('This Week')}</Text>
          <Text variant="bodySmall">{weekly.rewardClaimed ? t('Weekly reward claimed.') : t('Complete all goals to earn hints and a booster.')}</Text>
        </Card>
        {weekly.objectives.map((objective) => (
          <Card key={objective.id} style={styles.stack}>
            <View style={styles.row}>
              <Text variant="title">{t(objective.title)}</Text>
              <Text variant="caption">{objective.completed ? t('DONE') : `${objective.progress} / ${objective.target}`}</Text>
            </View>
            <ProgressBar value={objective.progress / objective.target} />
          </Card>
        ))}
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, gap: 14, paddingBottom: 34 },
  stack: { gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
});
