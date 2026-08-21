import { calculateVisualCoverage } from './density';
import { generateArrowCandidate, addArrowCells } from './generateArrow';
import { canPlaceWithoutOverlap } from './placement';
import { createSeededRandom } from './seededRandom';
import { validateLevelGeometry } from './validation';
import { canArrowEscape } from '../moves';
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
  const maxTries = Math.max(1600, config.targetArrowCount * 150);

  while (arrows.length < config.targetArrowCount && tries < maxTries) {
    tries += 1;
    const candidate = generateArrowCandidate(config, random, occupied, arrows.length);
    if (!candidate) continue;
    if (!canPlaceWithoutOverlap(candidate, arrows)) continue;
    if (!canArrowEscape([...arrows, candidate], { rows: config.rows, cols: config.cols }, candidate.id).canEscape) continue;
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

  const minimumArrowCount =
    config.difficulty === 'Easy'
      ? Math.max(4, Math.floor(config.targetArrowCount * 0.86))
      : config.difficulty === 'Normal'
        ? 20
        : config.difficulty === 'Hard'
          ? 35
          : 50;
  if (arrows.length < minimumArrowCount) return undefined;
  if (!validateLevelGeometry(baseLevel)) return undefined;
  const coverage = calculateVisualCoverage(arrows, config.rows, config.cols);
  const minimumArea = config.difficulty === 'Easy' ? (levelNumber <= 2 ? 0.42 : 0.58) : config.difficulty === 'Normal' ? 0.72 : 0.78;
  const minimumAxis = config.difficulty === 'Easy' ? 0.62 : config.difficulty === 'Normal' ? 0.78 : 0.82;
  if (coverage.usedAreaRatio < minimumArea) return undefined;
  if (coverage.widthRatio < minimumAxis || coverage.heightRatio < minimumAxis) return undefined;
  if (config.difficulty !== 'Easy' && (!coverage.centerOccupied || coverage.maxRegionShare > 0.58)) return undefined;

  const solver = solveLevel(baseLevel, { maxExploredStates: 35000 });
  if (!solver.solvable || !solver.solution) return undefined;

  const metrics = analyzeDifficulty({ ...baseLevel, solutionOrder: solver.solution });
  if (metrics.density < config.targetDensity.min * 0.76) return undefined;
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
