import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { AppBackground } from '../components/layout/AppBackground';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Card } from '../components/ui/Card';
import { DifficultyBadge } from '../components/ui/DifficultyBadge';
import { LockIcon, StarIcon } from '../components/ui/Icons';
import { Text } from '../components/ui/Text';
import { createLevelSummaries, TOTAL_LEVELS } from '../constants/levels';
import { LevelSummary } from '../engine/types/game';
import { useTheme } from '../hooks/useTheme';
import { useProgressStore } from '../store/progress/progressStore';

const LevelTile = ({ item }: { item: LevelSummary }) => {
  const theme = useTheme();
  const locked = item.state === 'locked';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Level ${item.level}, ${item.state}`}
      disabled={locked}
      onPress={() => router.push('/game')}
      style={({ pressed }) => [styles.tile, { backgroundColor: theme.colors.card, borderColor: theme.colors.divider, opacity: locked ? 0.5 : pressed ? 0.78 : 1 }]}
    >
      <View style={styles.tileTop}>
        <Text variant="title">{item.level}</Text>
        {locked ? <LockIcon color={theme.colors.textSecondary} /> : null}
      </View>
      <DifficultyBadge difficulty={item.difficulty} />
      <View style={styles.stars}>
        {Array.from({ length: 3 }, (_, index) => (
          <StarIcon key={index} color={index < item.stars ? theme.colors.accent : theme.colors.divider} />
        ))}
      </View>
    </Pressable>
  );
};

export default function LevelsScreen() {
  const highestUnlockedLevel = useProgressStore((state) => state.highestUnlockedLevel);
  const completedLevels = useProgressStore((state) => state.completedLevels);
  const levels = useMemo(() => createLevelSummaries(highestUnlockedLevel, completedLevels), [highestUnlockedLevel, completedLevels]);

  return (
    <AppBackground>
      <ScreenHeader title="Levels" subtitle={`${TOTAL_LEVELS} puzzle path prepared`} />
      <FlatList
        data={levels}
        keyExtractor={(item) => String(item.level)}
        numColumns={3}
        ListHeaderComponent={
          <Card style={styles.intro}>
            <Text variant="heading2">Path Progression</Text>
            <Text variant="bodySmall">Phase 1 renders all level states from progress data. Real level content arrives with the engine.</Text>
          </Card>
        }
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => <LevelTile item={item} />}
        showsVerticalScrollIndicator={false}
      />
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 18,
    paddingBottom: 34,
    gap: 12,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  intro: {
    marginBottom: 16,
    gap: 6,
  },
  tile: {
    flex: 1,
    minHeight: 128,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    justifyContent: 'space-between',
  },
  tileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
});
