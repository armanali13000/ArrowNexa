import { Difficulty, LevelSummary } from '../engine/types/game';

export const TOTAL_LEVELS = 500;

const difficulties: Difficulty[] = ['Easy', 'Normal', 'Hard', 'Expert'];

export const createLevelSummaries = (highestUnlockedLevel: number, completedLevels: Record<number, number>): LevelSummary[] =>
  Array.from({ length: TOTAL_LEVELS }, (_, index) => {
    const level = index + 1;
    const stars = completedLevels[level] ?? 0;
    return {
      level,
      difficulty: difficulties[Math.min(3, Math.floor(index / 125))],
      state: stars === 3 ? 'perfect' : stars > 0 ? 'completed' : level <= highestUnlockedLevel ? 'unlocked' : 'locked',
      stars,
    };
  });
