import { GeneratedLevel } from '../types/game';
import { analyzeDifficulty } from '../solver/difficulty';
import { denseReferenceLevel, testLevelOne, testLevelTwo, testLevelThree, testLevelFive } from './testLevels';
import { GENERATION_VERSION } from './levelConfig';

const fallbackByDifficulty = {
  Easy: testLevelOne,
  Normal: testLevelTwo,
  Hard: testLevelThree,
  Expert: denseReferenceLevel,
};

export const createFallbackLevel = (levelNumber: number, difficulty: keyof typeof fallbackByDifficulty, seed: string): GeneratedLevel => {
  const source = levelNumber > 300 && difficulty === 'Hard' ? denseReferenceLevel : fallbackByDifficulty[difficulty];
  const level = {
    ...source,
    id: `fallback-${difficulty.toLowerCase()}-${levelNumber}`,
    title: `Level ${levelNumber}`,
    difficulty,
    levelNumber,
    generationVersion: GENERATION_VERSION,
    seed,
    generationAttempts: 0,
    generationDurationMs: 0,
  };
  const metrics = analyzeDifficulty(level);
  return {
    ...level,
    metrics,
    difficultyScore: metrics.complexityScore,
  };
};
