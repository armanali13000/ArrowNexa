import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../storage/keys';

export type GameplaySessionData = {
  levelNumber: number;
  generationVersion: number;
  removedArrowIds: string[];
  moveHistory: string[];
  lives: number;
  moves: number;
  mistakes: number;
  hintsUsed: number;
  freeUndosUsed: number;
  usedExtraLife: boolean;
  startedAt: number;
  elapsedSeconds: number;
};

export const loadGameplaySession = async () => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.gameplaySession);
  return raw ? (JSON.parse(raw) as GameplaySessionData) : undefined;
};

export const saveGameplaySession = async (session: GameplaySessionData) => {
  await AsyncStorage.setItem(STORAGE_KEYS.gameplaySession, JSON.stringify(session));
};

export const clearGameplaySession = async () => {
  await AsyncStorage.removeItem(STORAGE_KEYS.gameplaySession);
};
