import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameBoard } from '../components/game/GameBoard';
import { PauseModal } from '../components/game/GameModals';
import { AppModal } from '../components/ui/AppModal';
import { Button, PrimaryButton, SecondaryButton } from '../components/ui/Button';
import { ArrowBackIcon, BoosterIcon, HeartIcon, HintIcon, PauseIcon, StarIcon, UndoIcon } from '../components/ui/Icons';
import { Text } from '../components/ui/Text';
import { DEFAULT_LIVES, FIRST_LIFE_LOSS_LEVEL, FREE_UNDOS_PER_LEVEL, MAX_LIVES_WITH_BOOSTER, REVEAL_COUNT } from '../constants/gameBalance';
import { createLevel } from '../engine/board';
import { canArrowEscape, getValidMoves, isBoardComplete, markArrowRemoved } from '../engine/moves';
import { calculateCompletionRewards } from '../engine/rewards/rewards';
import { calculateStars } from '../engine/rewards/stars';
import { getRecommendedMove } from '../engine/solver/hint';
import { GeneratedLevel, LevelPerformance, PuzzleArrow } from '../engine/types/game';
import { useTheme } from '../hooks/useTheme';
import { economyService } from '../services/economy/economyService';
import { clearGameplaySession, loadGameplaySession, saveGameplaySession } from '../services/gameplay/sessionStorage';
import { hapticsService } from '../services/haptics/hapticsService';
import { audioService } from '../services/audio/audioService';
import { createDailyChallengeLevel, getDailyDifficulty } from '../services/progression/dailyChallengeService';
import { formatDayMonth, getLocalDateKey } from '../services/progression/dateService';
import { saveCachedLevel } from '../services/storage/levelCacheStorage';
import { useGameStore } from '../store/game/gameStore';
import { useProgressStore } from '../store/progress/progressStore';
import { GENERATION_VERSION } from '../engine/levels/levelConfig';
import { calculateLevelXP } from '../services/progression/xpService';

const DEBUG_BOARD = false;

type CompletionSummary = {
  stars: number;
  moves: number;
  mistakes: number;
  hintsUsed: number;
  timeSeconds: number;
  rewardLabel: string;
  xpGained: number;
  nexaRank: number;
};

export default function GameScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ level?: string; mode?: string; date?: string }>();
  const isDailyMode = params.mode === 'daily';
  const dailyDate = typeof params.date === 'string' ? params.date : getLocalDateKey();
  const recommendedLevel = useProgressStore((state) => state.currentLevel);
  const routeLevel = Number(params.level);
  const [currentLevel, setCurrentLevel] = useState(() => Math.max(1, Math.min(500, routeLevel || recommendedLevel)));
  const completedLevels = useProgressStore((state) => state.completedLevels);
  const nexaRank = useProgressStore((state) => state.nexaRank);
  const hints = useProgressStore((state) => state.hints);
  const boosters = useProgressStore((state) => state.boosterInventory);
  const claimedRewards = useProgressStore((state) => state.claimedRewards);
  const recordLevelCompletion = useProgressStore((state) => state.recordLevelCompletion);
  const recordDailyChallengeCompletion = useProgressStore((state) => state.recordDailyChallengeCompletion);
  const recordDailyChallengeStarted = useProgressStore((state) => state.recordDailyChallengeStarted);
  const recordLifeLost = useProgressStore((state) => state.recordLifeLost);
  const recordBlockedTap = useProgressStore((state) => state.recordBlockedTap);
  const recordUndoUsed = useProgressStore((state) => state.recordUndoUsed);
  const recordRetry = useProgressStore((state) => state.recordRetry);
  const setPauseVisible = useGameStore((state) => state.setPauseVisible);
  const [level, setLevel] = useState<GeneratedLevel>(() => (isDailyMode ? createDailyChallengeLevel(dailyDate) : createLevel(currentLevel)));
  const [arrows, setArrows] = useState<PuzzleArrow[]>(() => cloneLevelArrows(level));
  const [lives, setLives] = useState(DEFAULT_LIVES);
  const [moveCount, setMoveCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [freeUndosUsed, setFreeUndosUsed] = useState(0);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [highlightedArrowIds, setHighlightedArrowIds] = useState<string[]>([]);
  const [movingArrowIds, setMovingArrowIds] = useState<string[]>([]);
  const [failedVisible, setFailedVisible] = useState(false);
  const [completeVisible, setCompleteVisible] = useState(false);
  const [boostersVisible, setBoostersVisible] = useState(false);
  const [noHintsVisible, setNoHintsVisible] = useState(false);
  const [completion, setCompletion] = useState<CompletionSummary | undefined>();
  const [usedExtraLife, setUsedExtraLife] = useState(false);
  const startedAtRef = useRef(Date.now());
  const completionHandledRef = useRef(false);
  const completeHandlerRef = useRef<(finalArrows: PuzzleArrow[]) => void>(() => undefined);
  const lockedArrowIdsRef = useRef(new Set<string>());

  const validMoves = useMemo(() => getValidMoves(arrows, level.size), [arrows, level.size]);
  const removedArrowIds = useMemo(() => arrows.filter((arrow) => arrow.state === 'removed').map((arrow) => arrow.id), [arrows]);
  const remainingArrows = arrows.filter((arrow) => arrow.state !== 'removed').length;
  const motionLocked = movingArrowIds.length > 0 || arrows.some((arrow) => arrow.state === 'restoring');
  const undoAvailable = moveHistory.length > 0 && !motionLocked && !completeVisible && (freeUndosUsed < FREE_UNDOS_PER_LEVEL || boosters.undo > 0);

  useEffect(() => {
    if (Number.isFinite(routeLevel) && routeLevel > 0) setCurrentLevel(Math.max(1, Math.min(500, routeLevel)));
  }, [routeLevel]);

  const resetAttempt = useCallback((nextLevel = level) => {
    setArrows(cloneLevelArrows(nextLevel));
    setLives(DEFAULT_LIVES);
    setMoveCount(0);
    setMistakes(0);
    setHintsUsed(0);
    setFreeUndosUsed(0);
    setMoveHistory([]);
    setHighlightedArrowIds([]);
    setMovingArrowIds([]);
    lockedArrowIdsRef.current.clear();
    setFailedVisible(false);
    setCompleteVisible(false);
    setCompletion(undefined);
    setUsedExtraLife(false);
    completionHandledRef.current = false;
    startedAtRef.current = Date.now();
  }, [level]);

  useEffect(() => {
    let mounted = true;
    const nextLevel = isDailyMode ? createDailyChallengeLevel(dailyDate) : createLevel(currentLevel);
    setLevel(nextLevel);
    resetAttempt(nextLevel);
    if (isDailyMode) recordDailyChallengeStarted(dailyDate).catch(() => undefined);
    else saveCachedLevel(nextLevel).catch(() => undefined);

    const restoreSession = async () => {
      if (isDailyMode) return;
      const session = await loadGameplaySession();
      if (!mounted || session?.levelNumber !== currentLevel || session.generationVersion !== GENERATION_VERSION) return;
      const removed = new Set(session.removedArrowIds);
      setArrows(nextLevel.arrows.map((arrow) => ({ ...arrow, path: [...arrow.path], state: removed.has(arrow.id) ? 'removed' : 'normal' })));
      setLives(session.lives);
      setMoveCount(session.moves);
      setMistakes(session.mistakes);
      setHintsUsed(session.hintsUsed);
      setFreeUndosUsed(session.freeUndosUsed);
      setMoveHistory(session.moveHistory ?? session.removedArrowIds);
      setUsedExtraLife(session.usedExtraLife);
      startedAtRef.current = Date.now() - session.elapsedSeconds * 1000;
    };
    restoreSession().catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [currentLevel, dailyDate, isDailyMode, recordDailyChallengeStarted]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setPauseVisible(true);
      return true;
    });
    return () => subscription.remove();
  }, [setPauseVisible]);

  useEffect(() => {
    if (completeVisible || isDailyMode) return;
    saveGameplaySession({
      levelNumber: currentLevel,
      generationVersion: GENERATION_VERSION,
      removedArrowIds,
      moveHistory,
      lives,
      moves: moveCount,
      mistakes,
      hintsUsed,
      freeUndosUsed,
      usedExtraLife,
      startedAt: startedAtRef.current,
      elapsedSeconds: getElapsedSeconds(),
    }).catch(() => undefined);
  }, [completeVisible, currentLevel, freeUndosUsed, hintsUsed, isDailyMode, lives, mistakes, moveCount, moveHistory, removedArrowIds, usedExtraLife]);

  const handleArrowPress = useCallback(async (arrowId: string) => {
    if (completeVisible || failedVisible || movingArrowIds.length > 0 || lockedArrowIdsRef.current.has(arrowId)) return;
    const target = arrows.find((arrow) => arrow.id === arrowId);
    if (!target || target.state === 'moving' || target.state === 'restoring' || target.state === 'removed') return;
    lockedArrowIdsRef.current.add(arrowId);

    const result = canArrowEscape(arrows, level.size, arrowId);
    if (!result.canEscape) {
      void Promise.all([hapticsService.blocked(), audioService.blockedArrow()]).catch(() => undefined);
      setArrows((current) => current.map((arrow) => (arrow.id === arrowId ? { ...arrow, state: 'blocked' } : arrow)));
      setMistakes((count) => count + 1);
      if (currentLevel >= FIRST_LIFE_LOSS_LEVEL) {
        setLives((currentLives) => {
          const nextLives = Math.max(0, currentLives - 1);
          if (nextLives === 0) {
            setFailedVisible(true);
            audioService.gameOver().catch(() => undefined);
          }
          return nextLives;
        });
        recordLifeLost().catch(() => undefined);
        void Promise.all([hapticsService.lifeLost(), audioService.play('lifeLost')]).catch(() => undefined);
      }
      recordBlockedTap().catch(() => undefined);
      lockedArrowIdsRef.current.delete(arrowId);
      return;
    }

    void Promise.all([hapticsService.arrowSuccess(), audioService.arrowMove()]).catch(() => undefined);
    setHighlightedArrowIds([]);
    setMovingArrowIds((ids) => (ids.includes(arrowId) ? ids : [...ids, arrowId]));
    setMoveCount((count) => count + 1);
    setArrows((current) => current.map((arrow) => (arrow.id === arrowId ? { ...arrow, state: 'moving' } : arrow)));
  }, [arrows, completeVisible, currentLevel, failedVisible, level.size, movingArrowIds.length, recordBlockedTap, recordLifeLost]);

  const handleEscapeComplete = useCallback((arrowId: string) => {
    lockedArrowIdsRef.current.delete(arrowId);
    setMovingArrowIds((ids) => ids.filter((id) => id !== arrowId));
    setMoveHistory((history) => [...history, arrowId]);
    setArrows((current) => {
      const next = markArrowRemoved(current, arrowId);
      if (isBoardComplete(next)) setTimeout(() => completeHandlerRef.current(next), 0);
      return next;
    });
  }, []);

  const handleRestoreComplete = useCallback((arrowId: string) => {
    setArrows((current) => current.map((arrow) => (arrow.id === arrowId && arrow.state === 'restoring' ? { ...arrow, state: 'normal' } : arrow)));
    lockedArrowIdsRef.current.delete(arrowId);
  }, []);

  const handleHint = useCallback(async () => {
    if (motionLocked || completeVisible || failedVisible) return;
    const recommended = getRecommendedMove({ ...level, arrows }, removedArrowIds) ?? validMoves[0];
    if (!recommended) return;
    const spent = await economyService.spendHint();
    if (!spent) {
      setNoHintsVisible(true);
      return;
    }
    setHintsUsed((count) => count + 1);
    await Promise.all([hapticsService.hint(), audioService.play('hint')]);
    setHighlightedArrowIds([recommended]);
    setTimeout(() => setHighlightedArrowIds((current) => (current.includes(recommended) ? [] : current)), 2200);
  }, [arrows, completeVisible, failedVisible, level, motionLocked, removedArrowIds, validMoves]);

  const handleUndo = useCallback(async () => {
    if (!undoAvailable) return;
    const arrowId = moveHistory[moveHistory.length - 1];
    if (!arrowId) return;
    if (freeUndosUsed >= FREE_UNDOS_PER_LEVEL) {
      const spent = await economyService.useBooster('undo');
      if (!spent) return;
    } else {
      setFreeUndosUsed((count) => count + 1);
    }
    setHighlightedArrowIds([]);
    setMoveHistory((history) => history.slice(0, -1));
    setMoveCount((count) => Math.max(0, count - 1));
    setArrows((current) => current.map((arrow) => (arrow.id === arrowId ? { ...arrow, state: 'restoring' } : arrow)));
    await recordUndoUsed();
    await Promise.all([hapticsService.undo(), audioService.play('undo')]);
  }, [freeUndosUsed, moveHistory, recordUndoUsed, undoAvailable]);

  const useExtraLife = useCallback(async () => {
    if (lives >= MAX_LIVES_WITH_BOOSTER) return;
    const spent = await economyService.useBooster('extra_life');
    if (!spent) return;
    setUsedExtraLife(true);
    setLives((current) => (current === 0 ? 1 : Math.min(MAX_LIVES_WITH_BOOSTER, current + 1)));
    setFailedVisible(false);
    setBoostersVisible(false);
    await Promise.all([hapticsService.booster(), audioService.play('booster')]);
  }, [lives]);

  const useReveal = useCallback(async () => {
    if (motionLocked || completeVisible || failedVisible) return;
    const moves = validMoves.slice(0, REVEAL_COUNT);
    if (!moves.length) return;
    const spent = await economyService.useBooster('reveal');
    if (!spent) return;
    setHighlightedArrowIds(moves);
    setBoostersVisible(false);
    setTimeout(() => setHighlightedArrowIds([]), 1600);
    await Promise.all([hapticsService.booster(), audioService.play('booster')]);
  }, [completeVisible, failedVisible, motionLocked, validMoves]);

  const retry = useCallback(async () => {
    await recordRetry();
    lockedArrowIdsRef.current.clear();
    resetAttempt();
  }, [recordRetry, resetAttempt]);

  const handleComplete = useCallback(async (finalArrows: PuzzleArrow[]) => {
    if (completionHandledRef.current) return;
    completionHandledRef.current = true;
    const timeSeconds = getElapsedSeconds();
    const stars = calculateStars({ mistakes, hintsUsed, livesRemaining: lives, moves: moveCount, difficulty: level.difficulty });
    const xpGained = calculateLevelXP(level.difficulty, stars, !completedLevels[currentLevel]);
    const rewards = isDailyMode ? undefined : calculateCompletionRewards({
      levelNumber: currentLevel,
      completed: true,
      stars,
      moves: moveCount,
      mistakes,
      hintsUsed,
      livesRemaining: lives,
      timeSeconds,
      difficulty: level.difficulty,
      usedExtraLife,
    }, claimedRewards);
    const performance: LevelPerformance = {
      levelNumber: currentLevel,
      completed: true,
      stars,
      moves: moveCount,
      mistakes,
      hintsUsed,
      livesRemaining: lives,
      timeSeconds,
      difficulty: level.difficulty,
      usedExtraLife,
    };
    setCompletion({ stars, moves: moveCount, mistakes, hintsUsed, timeSeconds, rewardLabel: rewards?.label ?? 'Daily progress saved', xpGained: isDailyMode ? 0 : xpGained, nexaRank });
    setArrows(finalArrows);
    setCompleteVisible(true);
    void Promise.all([hapticsService.levelComplete(), audioService.levelComplete()]).catch(() => undefined);

    const persistCompletion = async () => {
      if (isDailyMode) {
        const result = await recordDailyChallengeCompletion(dailyDate, performance);
        setCompletion((current) => current ? { ...current, rewardLabel: result.rewardLabel, nexaRank: result.streak } : current);
        return;
      }
      if (!rewards) return;
      await recordLevelCompletion(performance, rewards.rewards, rewards.rewardKeys);
      await clearGameplaySession();
    };
    persistCompletion().catch(() => undefined);
  }, [claimedRewards, completedLevels, currentLevel, dailyDate, hintsUsed, isDailyMode, level.difficulty, lives, mistakes, moveCount, nexaRank, recordDailyChallengeCompletion, recordLevelCompletion, usedExtraLife]);

  completeHandlerRef.current = handleComplete;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <View style={styles.leftControls}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.iconButton}>
            <ArrowBackIcon color="#1B1E22" size={20} />
          </Pressable>
          <View style={styles.counterPill} accessibilityLabel={`${remainingArrows} arrows remaining`}>
            <Text variant="caption" color="#061344">{remainingArrows}</Text>
          </View>
        </View>
        <View style={styles.levelCopy}>
          <Text variant="title" align="center" color="#1B1E22">{isDailyMode ? 'Daily Challenge' : `Level ${currentLevel}`}</Text>
          <Text variant="caption" align="center" color="#5F656B">{isDailyMode ? `${formatDayMonth(dailyDate)} - ${getDailyDifficulty(dailyDate).toUpperCase()}` : level.difficulty.toUpperCase()}</Text>
          <View style={styles.hearts} accessibilityLabel={`${lives} lives remaining`}>
            {Array.from({ length: MAX_LIVES_WITH_BOOSTER }, (_, index) => (
              <HeartIcon key={index} color="#D9514E" size={14} filled={index < lives} />
            ))}
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Pause menu" onPress={() => setPauseVisible(true)} style={styles.iconButton}>
          <PauseIcon color="#1B1E22" size={20} />
        </Pressable>
      </View>

      <Animated.View entering={FadeIn.duration(220)} style={styles.boardArea}>
        <GameBoard
          level={level}
          arrows={arrows}
          hintedArrowIds={highlightedArrowIds}
          debug={DEBUG_BOARD}
          onArrowPress={handleArrowPress}
          onEscapeComplete={handleEscapeComplete}
          onRestoreComplete={handleRestoreComplete}
        />
      </Animated.View>

      <View style={styles.footer}>
        <Tool icon={<HintIcon color="#1498E5" />} label="Hint" value={String(hints)} onPress={handleHint} disabled={motionLocked || completeVisible} />
        <Tool icon={<UndoIcon color="#1498E5" />} label="Undo" value={String(Math.max(0, FREE_UNDOS_PER_LEVEL - freeUndosUsed) + boosters.undo)} onPress={handleUndo} disabled={!undoAvailable} />
        <Tool icon={<BoosterIcon color="#1498E5" />} label="Boosters" value={`${boosters.extraLife + boosters.reveal + boosters.undo}`} onPress={() => setBoostersVisible(true)} disabled={motionLocked || completeVisible} />
      </View>

      <PauseModal onRestart={retry} />
      <CompleteModal daily={isDailyMode} visible={completeVisible} summary={completion} onNext={() => router.replace(isDailyMode ? '/daily' : `/game?level=${currentLevel + 1}`)} onReplay={retry} />
      <FailureModal visible={failedVisible} levelNumber={currentLevel} mistakes={mistakes} remaining={arrows.filter((arrow) => arrow.state !== 'removed').length} extraLives={boosters.extraLife} onRetry={retry} onExtraLife={useExtraLife} />
      <BoostersModal visible={boostersVisible} lives={lives} inventory={boosters} onClose={() => setBoostersVisible(false)} onExtraLife={useExtraLife} onUndo={handleUndo} undoDisabled={!undoAvailable} onReveal={useReveal} revealDisabled={!validMoves.length} />
      <NoHintsModal visible={noHintsVisible} onClose={() => setNoHintsVisible(false)} />
    </SafeAreaView>
  );

  function getElapsedSeconds() {
    return Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000));
  }
}

const cloneLevelArrows = (level: GeneratedLevel) => level.arrows.map((arrow) => ({ ...arrow, path: [...arrow.path], state: 'normal' as const }));

const Tool = ({ icon, label, value, disabled, onPress }: { icon: React.ReactNode; label: string; value: string; disabled?: boolean; onPress: () => void }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    disabled={disabled}
    onPress={() => {
      void Promise.all([hapticsService.button(), audioService.buttonClick()]).catch(() => undefined);
      onPress();
    }}
    style={({ pressed }) => [styles.tool, { opacity: disabled ? 0.35 : pressed ? 0.55 : 1 }]}
  >
    {icon}
    <Text variant="title" align="center" color="#1B1E22">{label}</Text>
    <Text variant="caption" align="center" color="#72777D">{value}</Text>
  </Pressable>
);

const CompleteModal = ({ daily, visible, summary, onNext, onReplay }: { daily?: boolean; visible: boolean; summary?: CompletionSummary; onNext: () => void; onReplay: () => void }) => (
  <AppModal visible={visible} onClose={() => undefined}>
    <View style={styles.modalStack}>
      <Text variant="heading1" align="center">{daily ? 'Daily Complete' : 'Level Complete'}</Text>
      <View style={styles.starRow}>
        {Array.from({ length: 3 }, (_, index) => (
          <Animated.View key={index} entering={visible ? ZoomIn.delay(index * 130).duration(260) : undefined}>
            <StarIcon color={summary && index < summary.stars ? '#FFB84D' : '#DBE5EA'} size={30} />
          </Animated.View>
        ))}
      </View>
      <Text variant="body" align="center">Moves {summary?.moves ?? 0} - Mistakes {summary?.mistakes ?? 0} - Hints {summary?.hintsUsed ?? 0} - Time {summary?.timeSeconds ?? 0}s</Text>
      <Text variant="title" align="center">{summary?.rewardLabel ?? 'Progress unlocked'}</Text>
      <Text variant="title" align="center">{daily ? `Daily Streak ${summary?.nexaRank ?? 1}` : `+${summary?.xpGained ?? 0} XP - Nexa Rank ${summary?.nexaRank ?? 1}`}</Text>
      <PrimaryButton title={daily ? 'Daily Home' : 'Next'} onPress={onNext} />
      <SecondaryButton title="Replay" onPress={onReplay} />
      <Button title="Levels" variant="ghost" onPress={() => router.push('/levels')} />
    </View>
  </AppModal>
);

const FailureModal = ({ visible, levelNumber, mistakes, remaining, extraLives, onRetry, onExtraLife }: { visible: boolean; levelNumber: number; mistakes: number; remaining: number; extraLives: number; onRetry: () => void; onExtraLife: () => void }) => (
  <AppModal visible={visible} onClose={() => undefined}>
    <View style={styles.modalStack}>
      <Text variant="heading1" align="center">Out of Lives</Text>
      <Text variant="body" align="center">Level {levelNumber} - Mistakes {mistakes} - {remaining} arrows remaining</Text>
      <PrimaryButton title="Retry" onPress={onRetry} />
      <SecondaryButton title={`Extra Life x${extraLives}`} disabled={extraLives <= 0} onPress={onExtraLife} />
      <Button title="Levels" variant="ghost" onPress={() => router.push('/levels')} />
    </View>
  </AppModal>
);

const BoostersModal = ({ visible, lives, inventory, onClose, onExtraLife, onUndo, undoDisabled, onReveal, revealDisabled }: { visible: boolean; lives: number; inventory: { extraLife: number; undo: number; reveal: number; clearBlocker: number }; onClose: () => void; onExtraLife: () => void; onUndo: () => void; undoDisabled: boolean; onReveal: () => void; revealDisabled: boolean }) => (
  <AppModal visible={visible} onClose={onClose}>
    <View style={styles.modalStack}>
      <Text variant="heading2" align="center">Boosters</Text>
      <Button title={`Extra Life x${inventory.extraLife}`} variant="tool" disabled={inventory.extraLife <= 0 || lives >= MAX_LIVES_WITH_BOOSTER} onPress={onExtraLife} />
      <Button title={`Undo x${inventory.undo}`} variant="tool" disabled={inventory.undo <= 0 || undoDisabled} onPress={onUndo} />
      <Button title={`Reveal x${inventory.reveal}`} variant="tool" disabled={inventory.reveal <= 0 || revealDisabled} onPress={onReveal} />
      <Button title="Close" variant="ghost" onPress={onClose} />
    </View>
  </AppModal>
);

const NoHintsModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <AppModal visible={visible} onClose={onClose}>
    <View style={styles.modalStack}>
      <Text variant="heading2" align="center">No Hints Left</Text>
      <Text variant="body" align="center">Earn hints through perfect clears, milestones, and every fifth completed level.</Text>
      <PrimaryButton title="Continue Playing" onPress={onClose} />
    </View>
  </AppModal>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FCFBF8' },
  topBar: { minHeight: 108, paddingHorizontal: 18, paddingTop: 4, alignItems: 'center', flexDirection: 'row' },
  iconButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  leftControls: { width: 58, alignItems: 'flex-start', gap: 8 },
  counterPill: { minWidth: 48, minHeight: 30, borderRadius: 8, backgroundColor: '#F3F5F7', alignItems: 'center', justifyContent: 'center' },
  levelCopy: { flex: 1, alignItems: 'center', gap: 4 },
  hearts: { flexDirection: 'row', gap: 7, paddingTop: 4 },
  boardArea: { flex: 1, justifyContent: 'center', paddingHorizontal: 4 },
  footer: { minHeight: 78, paddingHorizontal: 24, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tool: { minWidth: 78, minHeight: 58, alignItems: 'center', justifyContent: 'center', gap: 2 },
  modalStack: { gap: 14 },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
});
