import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameBoard } from '../components/game/GameBoard';
import { LevelCompleteModal, PauseModal } from '../components/game/GameModals';
import { ArrowBackIcon, GearIcon } from '../components/ui/Icons';
import { Text } from '../components/ui/Text';
import { denseReferenceLevel } from '../engine/board';
import { canArrowEscape, getValidMoves, isBoardComplete, markArrowRemoved } from '../engine/moves';
import { PuzzleArrow } from '../engine/types/game';
import { useTheme } from '../hooks/useTheme';
import { hapticsService } from '../services/haptics/hapticsService';
import { useGameStore } from '../store/game/gameStore';
import { useProgressStore } from '../store/progress/progressStore';

const DEBUG_BOARD = false;

export default function GameScreen() {
  const theme = useTheme();
  const currentLevel = useProgressStore((state) => state.currentLevel);
  const setPauseVisible = useGameStore((state) => state.setPauseVisible);
  const setCompleteVisible = useGameStore((state) => state.setCompleteVisible);
  const [arrows, setArrows] = useState<PuzzleArrow[]>(() => denseReferenceLevel.arrows.map((arrow) => ({ ...arrow, path: [...arrow.path] })));
  const [moveCount, setMoveCount] = useState(0);
  const [hintedArrowId, setHintedArrowId] = useState<string | undefined>();

  const validMoves = useMemo(() => getValidMoves(arrows, denseReferenceLevel.size), [arrows]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setPauseVisible(true);
      return true;
    });
    return () => subscription.remove();
  }, [setPauseVisible]);

  const restoreArrow = useCallback((arrowId: string) => {
    setArrows((current) => current.map((arrow) => (arrow.id === arrowId && arrow.state === 'blocked' ? { ...arrow, state: 'normal' } : arrow)));
  }, []);

  const handleArrowPress = useCallback(
    async (arrowId: string) => {
      const target = arrows.find((arrow) => arrow.id === arrowId);
      if (!target || target.state === 'moving' || target.state === 'removed') return;

      const result = canArrowEscape(arrows, denseReferenceLevel.size, arrowId);
      if (!result.canEscape) {
        await hapticsService.error();
        setArrows((current) => current.map((arrow) => (arrow.id === arrowId ? { ...arrow, state: 'blocked' } : arrow)));
        setTimeout(() => restoreArrow(arrowId), 260);
        return;
      }

      await hapticsService.success();
      setHintedArrowId(undefined);
      setMoveCount((count) => count + 1);
      setArrows((current) => current.map((arrow) => (arrow.id === arrowId ? { ...arrow, state: 'moving' } : arrow)));
    },
    [arrows, restoreArrow],
  );

  const handleEscapeComplete = useCallback(
    (arrowId: string) => {
      setArrows((current) => {
        const next = markArrowRemoved(current, arrowId);
        if (isBoardComplete(next)) {
          setCompleteVisible(true);
        }
        return next;
      });
    },
    [setCompleteVisible],
  );

  const handleHint = useCallback(async () => {
    const [firstMove] = validMoves;
    if (!firstMove) {
      await hapticsService.error();
      return;
    }
    await hapticsService.tap();
    setHintedArrowId(firstMove);
    setTimeout(() => setHintedArrowId((current) => (current === firstMove ? undefined : current)), 1200);
  }, [validMoves]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.iconButton}>
          <ArrowBackIcon color="#1B1E22" size={20} />
        </Pressable>
        <View style={styles.levelCopy}>
          <Text variant="title" align="center" color="#1B1E22">Level {currentLevel}</Text>
          <Text variant="caption" align="center" color="#5F656B">{denseReferenceLevel.difficulty.toUpperCase()}</Text>
          <View style={styles.hearts} accessibilityLabel="Lives 3">
            <View style={styles.heart} />
            <View style={styles.heart} />
            <View style={styles.heart} />
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Pause menu" onPress={() => setPauseVisible(true)} style={styles.iconButton}>
          <GearIcon color="#1B1E22" size={20} />
        </Pressable>
      </View>

      <View style={styles.boardArea}>
        <GameBoard
          level={denseReferenceLevel}
          arrows={arrows}
          hintedArrowId={hintedArrowId}
          debug={DEBUG_BOARD}
          onArrowPress={handleArrowPress}
          onEscapeComplete={handleEscapeComplete}
        />
      </View>

      <View style={styles.footer}>
        <Tool label="Hint" value={String(validMoves.length)} onPress={handleHint} />
        <Tool label="Undo" value="Off" disabled onPress={() => undefined} />
        <Tool label="Menu" value={`${moveCount} moves`} onPress={() => setPauseVisible(true)} />
      </View>

      <PauseModal />
      <LevelCompleteModal />
    </SafeAreaView>
  );
}

const Tool = ({ label, value, disabled, onPress }: { label: string; value: string; disabled?: boolean; onPress: () => void }) => (
  <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.tool, { opacity: disabled ? 0.35 : pressed ? 0.55 : 1 }]}>
    <Text variant="title" align="center" color="#1B1E22">{label}</Text>
    <Text variant="caption" align="center" color="#72777D">{value}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FCFBF8',
  },
  topBar: {
    minHeight: 108,
    paddingHorizontal: 18,
    paddingTop: 4,
    alignItems: 'center',
    flexDirection: 'row',
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelCopy: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  hearts: {
    flexDirection: 'row',
    gap: 7,
    paddingTop: 4,
  },
  heart: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D9514E',
    transform: [{ rotate: '45deg' }],
  },
  boardArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  footer: {
    minHeight: 92,
    paddingHorizontal: 34,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tool: {
    minWidth: 72,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
