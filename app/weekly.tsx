import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppBackground } from '../components/layout/AppBackground';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Card } from '../components/ui/Card';
import { BadgeTile, GamePanel } from '../components/ui/GamePanel';
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
        <GamePanel title={complete ? t('Reward Ready') : t('Weekly Missions')} eyebrow={t('MONDAY RESET')} accent={complete ? '#FFB84D' : '#38BDF8'} style={styles.hero}>
          <Text variant="bodySmall">{weekly.rewardClaimed ? t('Weekly reward claimed.') : t('Complete all goals to earn hints and a booster.')}</Text>
          <View style={styles.badges}>
            <BadgeTile icon="*" label={t('Missions')} value={`${weekly.objectives.filter((item) => item.completed).length}/${weekly.objectives.length}`} accent="#FFB84D" />
            <BadgeTile icon=">" label={t('Reward')} value={weekly.rewardClaimed ? t('DONE') : t('CHEST')} accent="#38BDF8" />
          </View>
        </GamePanel>
        {weekly.objectives.map((objective) => (
          <GamePanel key={objective.id} accent={objective.completed ? '#FFB84D' : '#22D3EE'} style={styles.mission}>
            <View style={styles.row}>
              <Text variant="heading2" color={objective.completed ? '#FFB84D' : '#22D3EE'}>{objective.completed ? '*' : '>'}</Text>
              <Text variant="title">{t(objective.title)}</Text>
              <Text variant="caption">{objective.completed ? t('DONE') : `${objective.progress} / ${objective.target}`}</Text>
            </View>
            <ProgressBar value={objective.progress / objective.target} />
          </GamePanel>
        ))}
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, gap: 14, paddingBottom: 34 },
  stack: { gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  hero: { minHeight: 170 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mission: { paddingVertical: 16 },
});
