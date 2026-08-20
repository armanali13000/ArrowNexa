import AsyncStorage from '@react-native-async-storage/async-storage';
import { STARTING_BOOSTERS, STARTING_HINTS } from '../../constants/gameBalance';
import { Achievement, BoosterInventory } from '../../engine/types/game';
import { DailyRewardState, defaultDailyRewardState } from '../progression/dailyRewardService';
import { STORAGE_KEYS } from './keys';

export type LevelRecord = {
  stars: number;
  bestMistakes: number;
  bestHintsUsed: number;
  bestTimeSeconds: number;
  bestMoves: number;
};

export type ProgressStats = {
  totalMoves: number;
  totalMistakes: number;
  totalLivesLost: number;
  boostersUsed: number;
  retries: number;
  threeStarLevels: number;
  totalXPEarned: number;
  highestNexaRank: number;
  dailyRewardsClaimed: number;
  chapterFinalesCompleted: number;
  chaptersCompleted: number;
};

export type ProgressData = {
  version: 3;
  currentLevel: number;
  highestUnlockedLevel: number;
  completedLevels: Record<number, number>;
  levelRecords: Record<number, LevelRecord>;
  xp: number;
  nexaRank: number;
  highestNexaRank: number;
  completedChapters: number[];
  hints: number;
  boosterInventory: BoosterInventory;
  streak: number;
  bestStreak: number;
  totalArrowsCleared: number;
  hintsUsed: number;
  totalPlayTimeSeconds: number;
  stats: ProgressStats;
  achievements: Record<string, Pick<Achievement, 'progress' | 'unlocked' | 'unlockedAt'>>;
  claimedRewards: Record<string, boolean>;
  mechanicTutorialsSeen: Record<string, boolean>;
  dailyReward: DailyRewardState;
};

export const defaultProgress: ProgressData = {
  version: 3,
  currentLevel: 1,
  highestUnlockedLevel: 1,
  completedLevels: {},
  levelRecords: {},
  xp: 0,
  nexaRank: 1,
  highestNexaRank: 1,
  completedChapters: [],
  hints: STARTING_HINTS,
  boosterInventory: {
    extraLife: STARTING_BOOSTERS.extraLife,
    undo: STARTING_BOOSTERS.undo,
    reveal: STARTING_BOOSTERS.reveal,
    clearBlocker: STARTING_BOOSTERS.clearBlocker,
  },
  streak: 0,
  bestStreak: 0,
  totalArrowsCleared: 0,
  hintsUsed: 0,
  totalPlayTimeSeconds: 0,
  stats: {
    totalMoves: 0,
    totalMistakes: 0,
    totalLivesLost: 0,
    boostersUsed: 0,
    retries: 0,
    threeStarLevels: 0,
    totalXPEarned: 0,
    highestNexaRank: 1,
    dailyRewardsClaimed: 0,
    chapterFinalesCompleted: 0,
    chaptersCompleted: 0,
  },
  achievements: {},
  claimedRewards: {},
  mechanicTutorialsSeen: {},
  dailyReward: defaultDailyRewardState,
};

const createRecordsFromCompleted = (completedLevels: Record<number, number>) =>
  Object.fromEntries(
    Object.entries(completedLevels).map(([level, stars]) => [
      Number(level),
      {
        stars,
        bestMistakes: stars === 3 ? 0 : 99,
        bestHintsUsed: stars === 3 ? 0 : 99,
        bestTimeSeconds: 0,
        bestMoves: 0,
      },
    ]),
  ) as Record<number, LevelRecord>;

const migrateProgress = (rawProgress: Partial<ProgressData>): ProgressData => {
  const completedLevels = rawProgress.completedLevels ?? defaultProgress.completedLevels;
  const levelRecords = rawProgress.levelRecords ?? createRecordsFromCompleted(completedLevels);
  return {
    ...defaultProgress,
    ...rawProgress,
    version: 3,
    completedLevels,
    levelRecords,
    xp: rawProgress.xp ?? 0,
    nexaRank: rawProgress.nexaRank ?? 1,
    highestNexaRank: rawProgress.highestNexaRank ?? rawProgress.nexaRank ?? 1,
    completedChapters: rawProgress.completedChapters ?? [],
    hints: rawProgress.hints ?? STARTING_HINTS,
    boosterInventory: { ...defaultProgress.boosterInventory, ...rawProgress.boosterInventory },
    stats: { ...defaultProgress.stats, ...rawProgress.stats },
    achievements: rawProgress.achievements ?? {},
    claimedRewards: rawProgress.claimedRewards ?? {},
    mechanicTutorialsSeen: rawProgress.mechanicTutorialsSeen ?? {},
    dailyReward: { ...defaultDailyRewardState, ...rawProgress.dailyReward },
  };
};

export const loadProgress = async (): Promise<ProgressData> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.progress);
  if (!raw) return defaultProgress;
  return migrateProgress(JSON.parse(raw));
};

export const saveProgress = async (progress: ProgressData) => {
  await AsyncStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(progress));
};

export const resetProgressStorage = async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(defaultProgress));
};
