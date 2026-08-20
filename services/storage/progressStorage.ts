import AsyncStorage from '@react-native-async-storage/async-storage';
import { Achievement } from '../../engine/types/game';
import { STORAGE_KEYS } from './keys';

export type ProgressData = {
  version: 1;
  currentLevel: number;
  highestUnlockedLevel: number;
  completedLevels: Record<number, number>;
  stars: number;
  hints: number;
  streak: number;
  bestStreak: number;
  totalArrowsCleared: number;
  hintsUsed: number;
  totalPlayTimeSeconds: number;
  achievements: Record<string, Pick<Achievement, 'progress' | 'unlocked' | 'unlockedAt'>>;
};

export const defaultProgress: ProgressData = {
  version: 1,
  currentLevel: 12,
  highestUnlockedLevel: 12,
  completedLevels: { 1: 3, 2: 2, 3: 3, 4: 1, 5: 3, 6: 2, 7: 2, 8: 3, 9: 1, 10: 3, 11: 2 },
  stars: 25,
  hints: 3,
  streak: 0,
  bestStreak: 0,
  totalArrowsCleared: 0,
  hintsUsed: 0,
  totalPlayTimeSeconds: 0,
  achievements: {},
};

export const loadProgress = async (): Promise<ProgressData> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.progress);
  if (!raw) return defaultProgress;
  return { ...defaultProgress, ...JSON.parse(raw) };
};

export const saveProgress = async (progress: ProgressData) => {
  await AsyncStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(progress));
};

export const resetProgressStorage = async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(defaultProgress));
};
