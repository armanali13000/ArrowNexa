import { Difficulty, LevelGenerationConfig } from '../types/game';

export const GENERATION_VERSION = 1;

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
      targetArrowCount: early ? Math.min(14, 4 + levelNumber) : 10 + Math.round(score / 4),
      minPathLength: 2,
      maxPathLength: early ? (levelNumber <= 3 ? 3 : 4) : 4,
      maxTurnsPerArrow: early ? (levelNumber <= 3 ? 0 : 1) : 1,
      targetDensity: { min: early ? 0.12 : 0.25, max: early ? 0.36 : 0.42 },
      difficulty,
      targetScore: score,
      seed,
    };
  }
  if (difficulty === 'Normal') {
    return {
      rows: score < 38 ? 9 : 10,
      cols: score < 38 ? 9 : 10,
      targetArrowCount: 18 + Math.round((score - 26) * 0.55),
      minPathLength: 2,
      maxPathLength: 6,
      maxTurnsPerArrow: 2,
      targetDensity: { min: 0.35, max: 0.53 },
      difficulty,
      targetScore: score,
      seed,
    };
  }
  if (difficulty === 'Hard') {
    return {
      rows: score < 64 ? 11 : 12,
      cols: score < 64 ? 11 : 12,
      targetArrowCount: 30 + Math.round((score - 51) * 0.9),
      minPathLength: 3,
      maxPathLength: 8,
      maxTurnsPerArrow: 3,
      targetDensity: { min: 0.45, max: 0.62 },
      difficulty,
      targetScore: score,
      seed,
    };
  }
  return {
    rows: score < 88 ? 13 : 14,
    cols: score < 88 ? 13 : 14,
    targetArrowCount: 45 + Math.round((score - 76) * 1.15),
    minPathLength: 3,
    maxPathLength: 10,
    maxTurnsPerArrow: 4,
    targetDensity: { min: 0.5, max: 0.7 },
    difficulty,
    targetScore: score,
    seed,
  };
};

export const createLevelSeed = (levelNumber: number, attempt = 0) => `arrownexa-v${GENERATION_VERSION}-level-${levelNumber}-attempt-${attempt}`;
