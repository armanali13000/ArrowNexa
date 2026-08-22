import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppBackground } from '../components/layout/AppBackground';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Text } from '../components/ui/Text';
import { achievementCatalog, achievementCategories } from '../constants/achievements';
import { AchievementCategory } from '../engine/types/game';
import { useTheme } from '../hooks/useTheme';
import { useProgressStore } from '../store/progress/progressStore';
import { useAppCopy } from '../hooks/useAppCopy';

type Filter = 'All' | AchievementCategory;

export default function AchievementsScreen() {
  const theme = useTheme();
  const { t } = useAppCopy();
  const progressMap = useProgressStore((state) => state.achievements);
  const [filter, setFilter] = useState<Filter>('All');
  const unlockedCount = achievementCatalog.filter((achievement) => progressMap[achievement.id]?.unlocked).length;
  const visibleAchievements = useMemo(
    () => achievementCatalog.filter((achievement) => filter === 'All' || achievement.category === filter),
    [filter],
  );

  return (
    <AppBackground>
      <ScreenHeader title={t('Achievements')} subtitle={`${unlockedCount} / ${achievementCatalog.length}`} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {achievementCategories.map((category) => (
            <Button key={category} title={t(category)} variant={filter === category ? 'primary' : 'tool'} onPress={() => setFilter(category)} style={styles.filterButton} />
          ))}
        </ScrollView>
        {visibleAchievements.map((achievement) => {
          const stored = progressMap[achievement.id];
          const value = stored?.progress ?? achievement.progress;
          const unlocked = stored?.unlocked ?? achievement.unlocked;
          const hidden = achievement.hidden && !unlocked;
          return (
            <Card key={achievement.id} style={styles.card}>
              <View style={[styles.icon, { backgroundColor: unlocked ? theme.colors.primary : theme.colors.boardBackground }]}>
                <Text variant="caption" color={unlocked ? '#FFFFFF' : theme.colors.textSecondary}>{hidden ? '??' : achievement.icon}</Text>
              </View>
              <View style={styles.achievementCopy}>
                <View style={styles.row}>
                  <Text variant="title">{hidden ? '???' : t(achievement.title)}</Text>
                  <Text variant="caption" color={unlocked ? theme.colors.primary : theme.colors.textSecondary}>{t(achievement.tier ?? achievement.category ?? '')}</Text>
                </View>
                <Text variant="bodySmall" color={theme.colors.textSecondary}>{hidden ? t('Secret achievement.') : t(achievement.description)}</Text>
                <ProgressBar value={value / achievement.target} />
                <View style={styles.row}>
                  <Text variant="caption" color={theme.colors.textSecondary}>{value} / {achievement.target}</Text>
                  <Text variant="caption" color={theme.colors.textSecondary}>{stored?.rewardGranted ? t('Reward granted') : achievement.reward ? t('Reward on unlock') : ''}</Text>
                </View>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, gap: 12, paddingBottom: 34 },
  filters: { gap: 8, paddingBottom: 2 },
  filterButton: { minHeight: 42 },
  card: { flexDirection: 'row', gap: 14 },
  icon: { width: 48, height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  achievementCopy: { flex: 1, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
});
