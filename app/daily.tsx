import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { AppBackground } from '../components/layout/AppBackground';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Button, PrimaryButton, SecondaryButton } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Text } from '../components/ui/Text';
import { DAILY_REWARD_SCHEDULE } from '../constants/progression';
import { getDailyDifficulty, getDailyStatus } from '../services/progression/dailyChallengeService';
import { addDays, formatDayMonth, getLocalDateKey } from '../services/progression/dateService';
import { claimDailyReward, getDailyClaimStatus } from '../services/progression/dailyRewardService';
import { ensureWeeklyChallenge } from '../services/progression/weeklyChallengeService';
import { audioService } from '../services/audio/audioService';
import { hapticsService } from '../services/haptics/hapticsService';
import { useProgressStore } from '../store/progress/progressStore';
import { useAppCopy } from '../hooks/useAppCopy';

export default function DailyScreen() {
  const progress = useProgressStore();
  const { copy, t } = useAppCopy();
  const claimDailyRewards = useProgressStore((state) => state.claimDailyRewards);
  const [message, setMessage] = useState<string | undefined>();
  const today = getLocalDateKey();
  const dailyStatus = getDailyStatus(progress, today);
  const todayResult = progress.dailyChallenges[today];
  const dailyRewardStatus = useMemo(() => getDailyClaimStatus(progress.dailyReward), [progress.dailyReward]);
  const weekly = ensureWeeklyChallenge(progress);
  const history = Array.from({ length: 14 }, (_, index) => addDays(today, -13 + index));

  const claim = async () => {
    const result = claimDailyReward(progress.dailyReward);
    if (!result.claimed) {
      setMessage(result.state.lastKnownDate && result.state.lastKnownDate > (progress.dailyReward.lastKnownDate ?? '') ? t('Come back tomorrow.') : t('Reward already claimed today.'));
      return;
    }
    await claimDailyRewards([...result.rewards, ...result.streakRewards], result.state);
    await Promise.all([hapticsService.booster(), audioService.play('dailyReward')]);
    setMessage(t('Daily reward claimed.'));
  };

  return (
    <AppBackground>
      <ScreenHeader title={copy.dailyChallenge} subtitle={`${formatDayMonth(today)} - ${t(getDailyDifficulty(today))}`} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.stack}>
          <View style={styles.row}>
            <View>
              <Text variant="caption">{t('TODAY')}</Text>
              <Text variant="heading1">{t(dailyStatus)}</Text>
              <Text variant="bodySmall">{t('Challenge Streak')} {progress.challengeStreak.current} - {t('Best')} {progress.challengeStreak.best}</Text>
            </View>
            <View style={styles.badge}>
              <Text variant="title" color="#FFFFFF">{t(getDailyDifficulty(today)).toUpperCase()}</Text>
            </View>
          </View>
          <Text variant="bodySmall">{t('Best')}: {todayResult?.bestStars ?? 0} {t('stars')} - {todayResult?.bestTimeSeconds ? `${todayResult.bestTimeSeconds}s` : t('No time yet')}</Text>
          <PrimaryButton
            title={dailyStatus === 'Not Played' ? copy.play : todayResult?.completed ? t('REPLAY') : copy.continue}
            onPress={() => router.push({ pathname: '/game', params: { mode: 'daily', date: today } })}
          />
        </Card>

        <Card style={styles.stack}>
          <View style={styles.row}>
            <Text variant="heading2">{t('Daily History')}</Text>
            <Text variant="caption">{progress.stats.dailyChallengesCompleted} {copy.complete}</Text>
          </View>
          <View style={styles.calendar}>
            {history.map((date) => {
              const result = progress.dailyChallenges[date];
              const label = date === today && !result?.completed ? 'O' : result?.perfect ? '*' : result?.completed ? 'C' : '-';
              return (
                <View key={date} style={styles.dayCell}>
                  <Text variant="caption">{formatDayMonth(date).slice(0, 2)}</Text>
                  <View style={[styles.historyDot, result?.perfect && styles.perfectDot, result?.completed && !result.perfect && styles.completedDot]}>
                    <Text variant="caption" color={result?.completed ? '#FFFFFF' : '#72777D'}>{label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        <Card style={styles.stack}>
          <View style={styles.row}>
            <Text variant="heading2">{t('Weekly Goals')}</Text>
            <SecondaryButton title={copy.open} onPress={() => router.push('/weekly')} style={styles.smallButton} />
          </View>
          {weekly.objectives.map((objective) => (
            <View key={objective.id} style={styles.objective}>
              <View style={styles.row}>
                <Text variant="bodySmall">{t(objective.title)}</Text>
                <Text variant="caption">{objective.progress} / {objective.target}</Text>
              </View>
              <ProgressBar value={objective.progress / objective.target} />
            </View>
          ))}
        </Card>

        <Card style={styles.stack}>
          <Text variant="heading2">{t('Daily Rewards')}</Text>
          <Text variant="bodySmall">{t('Claim once per local calendar day. Device clock rollback will not grant duplicates.')}</Text>
          <View style={styles.days}>
            {DAILY_REWARD_SCHEDULE.map((day) => {
              const state = day.day < progress.dailyReward.cycleDay ? 'claimed' : day.day === progress.dailyReward.cycleDay && dailyRewardStatus.available ? 'available' : 'locked';
              return (
                <Animated.View key={day.day} entering={state === 'available' ? ZoomIn.duration(260) : undefined} style={styles.rewardDayWrap}>
                  <Card style={styles.rewardDay}>
                    <Text variant="title">{t('Day')} {day.day}</Text>
                    <Text variant="caption">{t(state.toUpperCase())}</Text>
                    <Text variant="caption">{day.rewards.map((reward) => reward.type === 'hint' ? `+${reward.amount} ${t('Hint')}` : `+${reward.amount} ${t('Booster')}`).join(', ')}</Text>
                  </Card>
                </Animated.View>
              );
            })}
          </View>
          {message ? <Text variant="bodySmall" align="center">{message}</Text> : null}
          <PrimaryButton title={t('CLAIM LOGIN REWARD')} disabled={!dailyRewardStatus.available} onPress={claim} />
        </Card>

        {process.env.NODE_ENV !== 'production' ? <Button title="Dev: Replay Today" variant="ghost" onPress={() => router.push({ pathname: '/game', params: { mode: 'daily', date: today } })} /> : null}
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, gap: 14, paddingBottom: 34 },
  stack: { gap: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  badge: { minWidth: 76, minHeight: 40, borderRadius: 8, backgroundColor: '#1B8A8F', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  calendar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayCell: { width: 38, alignItems: 'center', gap: 4 },
  historyDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ECEFF1', alignItems: 'center', justifyContent: 'center' },
  completedDot: { backgroundColor: '#1B8A8F' },
  perfectDot: { backgroundColor: '#FFB84D' },
  objective: { gap: 6 },
  smallButton: { minWidth: 86 },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  rewardDayWrap: { width: '47%' },
  rewardDay: { minHeight: 104, gap: 6 },
});
