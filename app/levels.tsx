import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppBackground } from '../components/layout/AppBackground';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Card } from '../components/ui/Card';
import { LockIcon, StarIcon } from '../components/ui/Icons';
import { Text } from '../components/ui/Text';
import { createLevelMetadata } from '../engine/levels/levelFactory';
import { useTheme } from '../hooks/useTheme';
import { getChapters } from '../services/progression/chapterService';
import { calculateTotalStars } from '../services/progression/progressionService';
import { hapticsService } from '../services/haptics/hapticsService';
import { useProgressStore } from '../store/progress/progressStore';

export default function LevelsScreen() {
  const theme = useTheme();
  const highestUnlockedLevel = useProgressStore((state) => state.highestUnlockedLevel);
  const completedLevels = useProgressStore((state) => state.completedLevels);
  const [notice, setNotice] = useState<string | undefined>();
  const chapters = useMemo(() => getChapters(), []);
  const totalStars = calculateTotalStars(completedLevels);
  const currentChapterIndex = Math.max(0, Math.ceil(highestUnlockedLevel / 50) - 1);

  return (
    <AppBackground>
      <ScreenHeader title="Level Map" subtitle={`${totalStars} / 1500 stars`} />
      {notice ? <Text variant="caption" align="center" color={theme.colors.warning}>{notice}</Text> : null}
      <FlatList
        data={chapters}
        keyExtractor={(item) => String(item.chapter)}
        initialScrollIndex={currentChapterIndex}
        getItemLayout={(_, index) => ({ length: 720, offset: 720 * index, index })}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const levels = Array.from({ length: item.endLevel - item.startLevel + 1 }, (_, index) => item.startLevel + index);
          const completed = levels.filter((level) => completedLevels[level]).length;
          const stars = levels.reduce((sum, level) => sum + (completedLevels[level] ?? 0), 0);
          return (
            <Card style={styles.chapter}>
              <View style={styles.chapterHead}>
                <View>
                  <Text variant="heading2">Chapter {item.chapter}</Text>
                  <Text variant="title" color={theme.colors.textSecondary}>{item.name}</Text>
                </View>
                <Text variant="caption" color={theme.colors.textSecondary}>{completed}/50 - {stars}/150</Text>
              </View>
              <View style={styles.map}>
                <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 320 520">
                  <Path d={createPathData(levels.length)} fill="none" stroke={theme.colors.divider} strokeWidth="3" strokeLinecap="round" />
                </Svg>
                {levels.map((levelNumber, index) => {
                  const metadata = createLevelMetadata(levelNumber);
                  const state = completedLevels[levelNumber] === 3 ? 'perfect' : completedLevels[levelNumber] ? 'completed' : levelNumber === highestUnlockedLevel ? 'current' : levelNumber <= highestUnlockedLevel ? 'unlocked' : 'locked';
                  const finale = levelNumber % 50 === 0;
                  const position = nodePosition(index);
                  return (
                    <Pressable
                      key={levelNumber}
                      accessibilityRole="button"
                      accessibilityLabel={`Level ${levelNumber} ${state}`}
                      onPress={async () => {
                        if (state === 'locked') {
                          await hapticsService.warning();
                          setNotice(`Complete Level ${Math.max(1, levelNumber - 1)} first.`);
                          return;
                        }
                        router.push({ pathname: '/game', params: { level: String(levelNumber) } });
                      }}
                      style={[styles.node, position, { backgroundColor: nodeColor(state), borderColor: finale ? theme.colors.accent : theme.colors.divider }]}
                    >
                      {state === 'locked' ? <LockIcon color={theme.colors.textSecondary} size={14} /> : <Text variant="caption" color={state === 'current' ? '#FFFFFF' : theme.colors.textPrimary}>{levelNumber}</Text>}
                      {completedLevels[levelNumber] ? <View style={styles.nodeStars}>{Array.from({ length: completedLevels[levelNumber] }, (_, star) => <StarIcon key={star} color={theme.colors.accent} size={9} />)}</View> : null}
                      {finale ? <Text variant="caption" color={theme.colors.accent}>FINAL</Text> : null}
                      <Text variant="caption" color={theme.colors.textSecondary}>{metadata.difficulty[0]}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          );
        }}
      />
    </AppBackground>
  );
}

const nodePosition = (index: number) => {
  const row = Math.floor(index / 2);
  const side = index % 2 === 0 ? 0 : 1;
  return { left: side === 0 ? 46 : 214, top: 12 + row * 20 } as const;
};

const createPathData = (count: number) =>
  Array.from({ length: count }, (_, index) => {
    const position = nodePosition(index);
    return `${index === 0 ? 'M' : 'L'} ${position.left + 27} ${position.top + 27}`;
  }).join(' ');

const nodeColor = (state: string) => {
  if (state === 'current') return '#1B8A8F';
  if (state === 'perfect') return '#FFF1CC';
  if (state === 'completed') return '#FFFFFF';
  if (state === 'unlocked') return '#F4F8FB';
  return '#ECEFF1';
};

const styles = StyleSheet.create({
  list: { padding: 18, gap: 16, paddingBottom: 34 },
  chapter: { gap: 14 },
  chapterHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  map: { height: 520, position: 'relative' },
  node: { position: 'absolute', width: 54, height: 54, borderRadius: 27, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  nodeStars: { position: 'absolute', bottom: -11, flexDirection: 'row', gap: 1 },
});
