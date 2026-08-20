import { Difficulty, LevelSummary } from '../engine/types/game';
import { createLevelMetadata } from '../engine/levels/levelFactory';

export const TOTAL_LEVELS = 500;

export const createLevelSummaries = (highestUnlockedLevel: number, completedLevels: Record<number, number>): LevelSummary[] =>
  Array.from({ length: TOTAL_LEVELS }, (_, index) => {
    const level = index + 1;
    const stars = completedLevels[level] ?? 0;
    const metadata = createLevelMetadata(level);
    return {
      level,
      difficulty: metadata.difficulty as Difficulty,
      state: stars === 3 ? 'perfect' : stars > 0 ? 'completed' : level <= highestUnlockedLevel ? 'unlocked' : 'locked',
      stars,
    };
  });
