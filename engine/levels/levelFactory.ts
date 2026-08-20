import { generateLevelFromConfig } from '../generator/generateLevel';
import { GeneratedLevel } from '../types/game';
import { createFallbackLevel } from './fallbackLevels';
import { createGenerationConfig, createLevelSeed } from './levelConfig';

export const MAX_GENERATION_ATTEMPTS = 8;

export const createLevel = (levelNumber: number): GeneratedLevel => {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const seed = createLevelSeed(levelNumber, attempt);
    const config = createGenerationConfig(levelNumber, seed);
    const level = generateLevelFromConfig(config, levelNumber, attempt);
    if (!level) continue;
    const densityOk = level.metrics.density >= config.targetDensity.min * 0.45 && level.metrics.density <= config.targetDensity.max + 0.25;
    if (densityOk) return level;
  }
  const seed = createLevelSeed(levelNumber, MAX_GENERATION_ATTEMPTS);
  const config = createGenerationConfig(levelNumber, seed);
  return createFallbackLevel(levelNumber, config.difficulty, seed);
};

export const createLevelMetadata = (levelNumber: number) => {
  const score = createGenerationConfig(levelNumber, createLevelSeed(levelNumber)).targetScore;
  const config = createGenerationConfig(levelNumber, createLevelSeed(levelNumber));
  return {
    level: levelNumber,
    difficulty: config.difficulty,
    estimatedScore: score,
    seed: config.seed,
  };
};
