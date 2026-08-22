import { Difficulty, LevelGenerationConfig } from '../types/game';

export const GENERATION_VERSION = 7;

export const DIFFICULTY_THRESHOLDS: Array<{ max: number; difficulty: Difficulty }> = [
  { max: 25, difficulty: 'Easy' },
  { max: 50, difficulty: 'Normal' },
  { max: 75, difficulty: 'Hard' },
  { max: 100, difficulty: 'Expert' },
];

export const classifyDifficulty = (score: number): Difficulty =>
  DIFFICULTY_THRESHOLDS.find((entry) => score <= entry.max)?.difficulty ?? 'Expert';

export const getTargetScoreForLevel = (levelNumber: number) => {
  const clamped = Math.max(1, Math.min(500, levelNumber));
  const trend = 8 + (clamped - 1) * (82 / 499);
  const wave = ((clamped * 17) % 9) - 4;
  if (clamped <= 3) return 8 + clamped * 4;
  if (clamped <= 10) return 16 + clamped * 1.4;
  return Math.max(8, Math.min(92, trend + wave));
};

export const createGenerationConfig = (levelNumber: number, seed: string): LevelGenerationConfig => {
  const score = getTargetScoreForLevel(levelNumber);
  const difficulty = classifyDifficulty(score);
  if (difficulty === 'Easy') {
    const early = levelNumber <= 10;
    return {
      rows: 8,
      cols: 8,
      targetArrowCount: levelNumber === 1 ? 6 : levelNumber === 2 ? 10 : levelNumber <= 5 ? 12 + levelNumber : 18,
      minPathLength: 2,
      maxPathLength: early ? (levelNumber <= 2 ? 5 : 8) : 8,
      maxTurnsPerArrow: early ? (levelNumber <= 2 ? 1 : 3) : 3,
      targetDensity: { min: early ? 0.24 : 0.34, max: early ? 0.48 : 0.56 },
      difficulty,
      targetScore: score,
      seed,
    };
  }
  if (difficulty === 'Normal') {
    return {
      rows: 11,
      cols: 11,
      targetArrowCount: 28,
      minPathLength: 2,
      maxPathLength: 9,
      maxTurnsPerArrow: 3,
      targetDensity: { min: 0.5, max: 0.74 },
      difficulty,
      targetScore: score,
      seed,
    };
  }
  if (difficulty === 'Hard') {
    return {
      rows: score < 64 ? 14 : 15,
      cols: score < 64 ? 14 : 15,
      targetArrowCount: 42 + Math.round((score - 51) * 0.28),
      minPathLength: 3,
      maxPathLength: 11,
      maxTurnsPerArrow: 4,
      targetDensity: { min: 0.5, max: 0.72 },
      difficulty,
      targetScore: score,
      seed,
    };
  }
  return {
    rows: score < 88 ? 16 : 17,
    cols: score < 88 ? 16 : 17,
    targetArrowCount: 56 + Math.round((score - 76) * 0.28),
    minPathLength: 3,
    maxPathLength: 13,
    maxTurnsPerArrow: 4,
    targetDensity: { min: 0.5, max: 0.72 },
    difficulty,
    targetScore: score,
    seed,
  };
};

export const createLevelSeed = (levelNumber: number, attempt = 0) => `arrownexa-v${GENERATION_VERSION}-level-${levelNumber}-attempt-${attempt}`;
