import { createFallbackLevel } from '../../engine/levels/fallbackLevels';
import { GENERATION_VERSION, classifyDifficulty } from '../../engine/levels/levelConfig';
import { generateLevelFromConfig } from '../../engine/generator/generateLevel';
import { Difficulty, GeneratedLevel, LevelGenerationConfig, LevelPerformance, Reward } from '../../engine/types/game';
import { ChallengeStreakState, DailyChallengeResult, ProgressData } from '../storage/progressStorage';
import { addDays, getLocalDateKey, parseLocalDateKey } from './dateService';

export const DAILY_CHALLENGE_VERSION = 1;

export const createDailySeed = (dateKey = getLocalDateKey()) => `arrownexa-daily-v${DAILY_CHALLENGE_VERSION}-${dateKey}`;

export const getDailyDifficulty = (dateKey = getLocalDateKey()): Difficulty => {
  const day = parseLocalDateKey(dateKey).getDay();
  if (day === 0) return 'Expert';
  if (day === 3 || day === 5 || day === 6) return 'Hard';
  return 'Normal';
};

const scoreForDifficulty = (difficulty: Difficulty, dateKey: string) => {
  const bump = parseLocalDateKey(dateKey).getDate() % 4;
  if (difficulty === 'Expert') return 80 + bump;
  if (difficulty === 'Hard') return 62 + bump;
  return 40 + bump;
};

const createDailyConfig = (dateKey: string, attempt: number): LevelGenerationConfig => {
  const difficulty = getDailyDifficulty(dateKey);
  const targetScore = scoreForDifficulty(difficulty, dateKey);
  const base = difficulty === 'Expert'
    ? { rows: 13, cols: 13, targetArrowCount: 48, minPathLength: 3, maxPathLength: 9, maxTurnsPerArrow: 4, targetDensity: { min: 0.48, max: 0.68 } }
    : difficulty === 'Hard'
      ? { rows: 11, cols: 11, targetArrowCount: 32, minPathLength: 3, maxPathLength: 8, maxTurnsPerArrow: 3, targetDensity: { min: 0.44, max: 0.62 } }
      : { rows: 10, cols: 10, targetArrowCount: 24, minPathLength: 2, maxPathLength: 6, maxTurnsPerArrow: 2, targetDensity: { min: 0.34, max: 0.54 } };
  return {
    ...base,
    difficulty,
    targetScore,
    seed: `${createDailySeed(dateKey)}-attempt-${attempt}`,
  };
};

export const createDailyChallengeLevel = (dateKey = getLocalDateKey()): GeneratedLevel => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const config = createDailyConfig(dateKey, attempt);
    const level = generateLevelFromConfig(config, 900000 + Number(dateKey.replace(/-/g, '').slice(2)), attempt);
    if (level) return { ...level, id: `daily-${dateKey}`, title: 'Daily Challenge', seed: createDailySeed(dateKey) };
  }
  const config = createDailyConfig(dateKey, 8);
  return createFallbackLevel(900000, classifyDifficulty(config.targetScore), createDailySeed(dateKey));
};

export const getDailyReward = (difficulty: Difficulty, perfect: boolean): Reward[] => {
  const base: Reward[] = difficulty === 'Expert'
    ? [{ type: 'hint', amount: 2 }]
    : difficulty === 'Hard'
      ? [{ type: 'hint', amount: 1 }, { type: 'booster', booster: 'reveal', amount: 1 }]
      : [{ type: 'hint', amount: 1 }];
  return perfect ? [...base, { type: 'hint', amount: 1 }] : base;
};

export const updateChallengeStreak = (state: ChallengeStreakState, dateKey: string) => {
  if (state.lastCompletedDate === dateKey) return state;
  const yesterday = addDays(dateKey, -1);
  const current = state.lastCompletedDate === yesterday ? state.current + 1 : 1;
  return {
    ...state,
    current,
    best: Math.max(state.best, current),
    lastCompletedDate: dateKey,
  };
};

export const getChallengeStreakRewards = (streak: ChallengeStreakState): Reward[] => {
  const rewards: Reward[] = [];
  if (streak.current >= 3 && !streak.claimedMilestones['3']) rewards.push({ type: 'hint', amount: 1 });
  if (streak.current >= 7 && !streak.claimedMilestones['7']) rewards.push({ type: 'booster', booster: 'reveal', amount: 1 });
  if (streak.current >= 14 && !streak.claimedMilestones['14']) rewards.push({ type: 'hint', amount: 2 });
  if (streak.current >= 30 && !streak.claimedMilestones['30']) rewards.push({ type: 'booster', booster: 'undo', amount: 1 });
  return rewards;
};

export const markChallengeMilestonesClaimed = (streak: ChallengeStreakState) => {
  const claimedMilestones = { ...streak.claimedMilestones };
  ['3', '7', '14', '30'].forEach((milestone) => {
    if (streak.current >= Number(milestone)) claimedMilestones[milestone] = true;
  });
  return { ...streak, claimedMilestones };
};

export const mergeDailyResult = (current: DailyChallengeResult | undefined, performance: LevelPerformance, dateKey: string, rewardGranted: boolean): DailyChallengeResult => {
  const difficulty = getDailyDifficulty(dateKey);
  const perfect = performance.mistakes === 0 && performance.hintsUsed === 0;
  return {
    date: dateKey,
    seed: createDailySeed(dateKey),
    generationVersion: GENERATION_VERSION,
    difficulty,
    completed: true,
    perfect: Boolean(current?.perfect || perfect),
    bestStars: Math.max(current?.bestStars ?? 0, performance.stars),
    bestTimeSeconds: Math.min(current?.bestTimeSeconds ?? Number.POSITIVE_INFINITY, performance.timeSeconds),
    bestMistakes: Math.min(current?.bestMistakes ?? Number.POSITIVE_INFINITY, performance.mistakes),
    bestHintsUsed: Math.min(current?.bestHintsUsed ?? Number.POSITIVE_INFINITY, performance.hintsUsed),
    bestMoves: Math.min(current?.bestMoves ?? Number.POSITIVE_INFINITY, performance.moves),
    rewardGranted: current?.rewardGranted || rewardGranted,
    perfectRewardGranted: current?.perfectRewardGranted || perfect,
  };
};

export const getDailyStatus = (progress: ProgressData, dateKey = getLocalDateKey()) => {
  const result = progress.dailyChallenges[dateKey];
  if (!result) return 'Not Played';
  if (!result.completed) return 'In Progress';
  if (result.perfect) return 'Perfect';
  return 'Completed';
};
