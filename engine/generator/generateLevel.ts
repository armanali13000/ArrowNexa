import { getUsedAreaRatio } from './density';
import { generateArrowCandidate, addArrowCells } from './generateArrow';
import { canPlaceWithoutOverlap, preservesExistingSolutionPrefix } from './placement';
import { createSeededRandom } from './seededRandom';
import { validateLevelGeometry } from './validation';
import { analyzeDifficulty } from '../solver/difficulty';
import { solveLevel } from '../solver/solveLevel';
import { GeneratedLevel, LevelGenerationConfig, PuzzleArrow, PuzzleLevel } from '../types/game';
import { GENERATION_VERSION } from '../levels/levelConfig';

export type GenerationResult = {
  level: GeneratedLevel;
  attempts: number;
};

export const generateLevelFromConfig = (config: LevelGenerationConfig, levelNumber: number, attemptNumber = 0): GeneratedLevel | undefined => {
  const started = Date.now();
  const random = createSeededRandom(`${config.seed}:candidate`);
  const arrows: PuzzleArrow[] = [];
  const occupied = new Set<string>();
  let tries = 0;
  const maxTries = Math.max(600, config.targetArrowCount * 80);

  while (arrows.length < config.targetArrowCount && tries < maxTries) {
    tries += 1;
    const candidate = generateArrowCandidate(config, random, occupied, arrows.length);
    if (!candidate) continue;
    if (!canPlaceWithoutOverlap(candidate, arrows)) continue;
    if (!preservesExistingSolutionPrefix(candidate, arrows, { rows: config.rows, cols: config.cols })) continue;
    arrows.push(candidate);
    addArrowCells(occupied, candidate);
  }

  const baseLevel: PuzzleLevel = {
    id: `generated-${levelNumber}`,
    title: `Level ${levelNumber}`,
    size: { rows: config.rows, cols: config.cols },
    difficulty: config.difficulty,
    arrows,
    solutionOrder: arrows.map((arrow) => arrow.id),
  };

  if (arrows.length < Math.max(4, Math.floor(config.targetArrowCount * 0.72))) return undefined;
  if (!validateLevelGeometry(baseLevel)) return undefined;
  const usedAreaRatio = getUsedAreaRatio(arrows, config.rows, config.cols);
  if (usedAreaRatio < 0.5 && levelNumber > 10) return undefined;

  const solver = solveLevel(baseLevel, { maxExploredStates: 35000 });
  if (!solver.solvable || !solver.solution) return undefined;

  const metrics = analyzeDifficulty({ ...baseLevel, solutionOrder: solver.solution });
  return {
    ...baseLevel,
    difficulty: config.difficulty,
    solutionOrder: solver.solution,
    levelNumber,
    generationVersion: GENERATION_VERSION,
    seed: config.seed,
    difficultyScore: metrics.complexityScore,
    metrics,
    generationAttempts: attemptNumber + 1,
    generationDurationMs: Date.now() - started,
  };
};
