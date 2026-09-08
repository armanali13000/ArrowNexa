import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeneratedLevel } from '../../engine/types/game';

const keyForLevel = (levelNumber: number, generationVersion: number) => `@arrownexa/generated-level/v${generationVersion}/${levelNumber}`;

export const loadCachedLevel = async (levelNumber: number, generationVersion: number) => {
  const raw = await AsyncStorage.getItem(keyForLevel(levelNumber, generationVersion));
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as GeneratedLevel;
  } catch {
    return undefined;
  }
};

export const saveCachedLevel = async (level: GeneratedLevel) => {
  await AsyncStorage.setItem(keyForLevel(level.levelNumber, level.generationVersion), JSON.stringify(level));
};
