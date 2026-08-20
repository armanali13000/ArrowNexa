import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppBackground } from '../components/layout/AppBackground';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Button, PrimaryButton } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Text } from '../components/ui/Text';
import { DAILY_REWARD_SCHEDULE } from '../constants/progression';
import { claimDailyReward, getDailyClaimStatus } from '../services/progression/dailyRewardService';
import { hapticsService } from '../services/haptics/hapticsService';
import { useProgressStore } from '../store/progress/progressStore';

export default function DailyRewardsScreen() {
  const dailyReward = useProgressStore((state) => state.dailyReward);
  const claimDailyRewards = useProgressStore((state) => state.claimDailyRewards);
  const [message, setMessage] = useState<string | undefined>();
  const status = useMemo(() => getDailyClaimStatus(dailyReward), [dailyReward]);

  const claim = async () => {
    const result = claimDailyReward(dailyReward);
    if (!result.claimed) {
      setMessage(result.state.lastKnownDate && result.state.lastKnownDate > (dailyReward.lastKnownDate ?? '') ? 'Come back tomorrow.' : 'Reward already claimed today.');
      return;
    }
    await claimDailyRewards([...result.rewards, ...result.streakRewards], result.state);
    await hapticsService.success();
    setMessage('Daily reward claimed.');
  };

  return (
    <AppBackground>
      <ScreenHeader title="Daily Rewards" subtitle={`${dailyReward.currentStreak} day streak`} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.stack}>
          <Text variant="heading2">7-Day Cycle</Text>
          <Text variant="bodySmall">Claim once per local calendar day. Device clock rollback will not grant duplicates.</Text>
          <View style={styles.days}>
            {DAILY_REWARD_SCHEDULE.map((day) => {
              const state = day.day < dailyReward.cycleDay ? 'claimed' : day.day === dailyReward.cycleDay && status.available ? 'available' : 'locked';
              return (
                <Card key={day.day} style={styles.day}>
                  <Text variant="title">Day {day.day}</Text>
                  <Text variant="caption">{state.toUpperCase()}</Text>
                  <Text variant="caption">{day.rewards.map((reward) => reward.type === 'hint' ? `+${reward.amount} Hint` : `+${reward.amount} Booster`).join(', ')}</Text>
                </Card>
              );
            })}
          </View>
          {message ? <Text variant="bodySmall" align="center">{message}</Text> : null}
          <PrimaryButton title="CLAIM" disabled={!status.available} onPress={claim} />
        </Card>
        <Button title="Reset Daily State  Dev Only" variant="ghost" disabled={process.env.NODE_ENV === 'production'} onPress={() => setMessage('Use Reset Progress for full local reset.')} />
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, gap: 14, paddingBottom: 34 },
  stack: { gap: 14 },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  day: { width: '47%', minHeight: 104, gap: 6 },
});
