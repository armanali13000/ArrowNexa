import { Difficulty, LevelGenerationConfig } from '../types/game';

export const GENERATION_VERSION = 8;

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
  const chapterLevel = ((clamped - 1) % 50) + 1;
  const chapter = Math.floor((clamped - 1) / 50);
  const wave = (((clamped * 17) % 7) - 3) * 0.55;
  if (clamped <= 10) return 8 + clamped * 1.8;
  if (clamped <= 50) return Math.max(26, Math.min(58, 26 + (clamped - 10) * 0.8 + wave));
  return Math.max(42, Math.min(96, 42 + chapter * 5.4 + chapterLevel * 0.46 + wave));
};

export const createGenerationConfig = (levelNumber: number, seed: string): LevelGenerationConfig => {
  const score = getTargetScoreForLevel(levelNumber);
  const difficulty = classifyDifficulty(score);
  const chapterLevel = ((Math.max(1, Math.min(500, levelNumber)) - 1) % 50) + 1;
  const chapter = Math.floor((Math.max(1, Math.min(500, levelNumber)) - 1) / 50);
  if (difficulty === 'Easy') {
    const early = levelNumber <= 4;
    return {
      rows: 8,
      cols: 8,
      targetArrowCount: Math.min(22, levelNumber === 1 ? 6 : levelNumber === 2 ? 10 : 12 + levelNumber),
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
      rows: levelNumber >= 18 || chapter >= 2 ? 12 : 11,
      cols: levelNumber >= 18 || chapter >= 2 ? 12 : 11,
      targetArrowCount: Math.min(42, 21 + Math.max(0, levelNumber - 10)),
      minPathLength: 2,
      maxPathLength: chapter >= 1 ? 10 : 9,
      maxTurnsPerArrow: chapter >= 1 ? 4 : 3,
      targetDensity: { min: 0.46, max: 0.74 },
      difficulty,
      targetScore: score,
      seed,
    };
  }
  if (difficulty === 'Hard') {
    return {
      rows: score < 64 ? 13 : 14,
      cols: score < 64 ? 13 : 14,
      targetArrowCount: Math.min(56, 34 + Math.floor(chapterLevel * 0.42) + chapter * 2),
      minPathLength: 3,
      maxPathLength: 11 + Math.min(2, chapter),
      maxTurnsPerArrow: 4,
      targetDensity: { min: 0.46, max: 0.72 },
      difficulty,
      targetScore: score,
      seed,
    };
  }
  return {
    rows: score < 88 ? 15 : 16,
    cols: score < 88 ? 15 : 16,
    targetArrowCount: Math.min(74, 52 + Math.floor(chapterLevel * 0.28) + chapter * 2),
    minPathLength: 3,
    maxPathLength: 13 + Math.min(2, chapter),
    maxTurnsPerArrow: 5,
    targetDensity: { min: 0.46, max: 0.72 },
    difficulty,
    targetScore: score,
    seed,
  };
};

export const createLevelSeed = (levelNumber: number, attempt = 0) => `arrownexa-v${GENERATION_VERSION}-level-${levelNumber}-attempt-${attempt}`;
