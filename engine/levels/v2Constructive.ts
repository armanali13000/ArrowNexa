import { cellKey } from '../occupancy';
import { analyzeDifficulty } from '../solver/difficulty';
import { GeneratedLevel, PuzzleArrow, PuzzleLevel } from '../types/game';
import { GENERATION_VERSION } from './levelConfig';
import { getLevelDifficultyProfile, LevelDifficultyProfile } from './v2Profiles';

const key = (row: number, col: number) => `${row},${col}`;

const arrow = (id: string, cells: Array<[number, number]>, order: number): PuzzleArrow => {
  const path = cells.map(([row, col]) => ({ row, col }));
  const previous = path[path.length - 2];
  const head = path[path.length - 1];
  const direction = head.col > previous.col ? 'RIGHT' : head.col < previous.col ? 'LEFT' : head.row > previous.row ? 'DOWN' : 'UP';
  return { id, path, direction, state: 'normal', order };
};

const hasOverlap = (arrows: PuzzleArrow[]) => {
  const seen = new Set<string>();
  for (const item of arrows) {
    for (const point of item.path) {
      const id = cellKey(point);
      if (seen.has(id)) return true;
      seen.add(id);
    }
  }
  return false;
};

const makeHorizontal = (id: string, row: number, fromCol: number, toCol: number, order: number) =>
  arrow(id, range(fromCol, toCol).map((col) => [row, col]), order);

const makeVertical = (id: string, col: number, fromRow: number, toRow: number, order: number) =>
  arrow(id, range(fromRow, toRow).map((row) => [row, col]), order);

const range = (from: number, to: number) => {
  const step = from <= to ? 1 : -1;
  const values: number[] = [];
  for (let value = from; step > 0 ? value <= to : value >= to; value += step) values.push(value);
  return values;
};

const addFillers = (arrows: PuzzleArrow[], rows: number, cols: number, targetCount: number, startOrder: number) => {
  const used = new Set(arrows.flatMap((item) => item.path.map(cellKey)));
  let order = startOrder;
  for (let row = 0; row < rows && arrows.length < targetCount; row += 1) {
    for (let col = 0; col < cols - 1 && arrows.length < targetCount; col += 2) {
      if (used.has(key(row, col)) || used.has(key(row, col + 1))) continue;
      const id = `v2-f-${String(order).padStart(3, '0')}`;
      const item = arrow(id, [[row, col], [row, col + 1]], order);
      arrows.push(item);
      item.path.forEach((point) => used.add(cellKey(point)));
      order += 1;
    }
  }
};

const buildLevel1 = () => {
  const arrows = [
    makeHorizontal('v2-1-open-1', 0, 1, 2, 1),
    makeHorizontal('v2-1-open-2', 7, 6, 5, 2),
    makeVertical('v2-1-open-3', 0, 6, 5, 3),
    makeVertical('v2-1-open-4', 7, 1, 2, 4),
    makeHorizontal('v2-1-blocked-1', 3, 1, 3, 5),
    makeVertical('v2-1-blocker-1', 5, 5, 3, 6),
    makeHorizontal('v2-1-bend-1', 5, 1, 3, 7),
    makeVertical('v2-1-bend-2', 4, 6, 4, 8),
  ];
  return makeGenerated(1, 8, 8, arrows, 1);
};

type LayeredPattern = 'rightShort' | 'downShort' | 'rightLong' | 'downLong';

const cellsForTile = (row: number, col: number, pattern: LayeredPattern): Array<[number, number]> => {
  if (pattern === 'downShort') return [[row, col], [row, col + 1], [row + 1, col + 1]];
  if (pattern === 'rightLong') return [[row, col + 1], [row, col], [row + 1, col], [row + 1, col + 1]];
  if (pattern === 'downLong') return [[row + 1, col], [row, col], [row, col + 1], [row + 1, col + 1]];
  return [[row, col], [row + 1, col], [row + 1, col + 1]];
};

const buildLayered = (
  levelNumber: number,
  rows: number,
  cols: number,
  targetCount: number,
  pattern: LayeredPattern = levelNumber >= 250 ? 'downLong' : 'rightShort',
) => {
  const arrows: PuzzleArrow[] = [];
  let order = 1;

  for (let row = 0; row + 1 < rows && arrows.length < targetCount; row += 2) {
    for (let col = 0; col + 1 < cols && arrows.length < targetCount; col += 2) {
      arrows.push(arrow(`v2-${levelNumber}-t-${String(order).padStart(3, '0')}`, cellsForTile(row, col, pattern), order));
      order += 1;
    }
  }

  return makeGenerated(levelNumber, rows, cols, arrows, 1);
};

const makeGenerated = (levelNumber: number, rows: number, cols: number, arrows: PuzzleArrow[], attempts: number): GeneratedLevel => {
  const profile = getLevelDifficultyProfile(levelNumber);
  const base: PuzzleLevel = {
    id: `v2-${String(levelNumber).padStart(3, '0')}`,
    title: `Level ${levelNumber}`,
    size: { rows, cols },
    difficulty: profile.difficulty,
    arrows,
    solutionOrder: arrows.map((item) => item.id),
  };
  const metrics = analyzeDifficulty(base);
  return {
    ...base,
    levelNumber,
    generationVersion: GENERATION_VERSION,
    seed: `ARROWNEXA_V2_CONSTRUCTIVE_LEVEL_${levelNumber}`,
    difficultyScore: metrics.complexityScore,
    metrics,
    generationAttempts: attempts,
    generationDurationMs: 0,
  };
};

export const createConstructiveV2Level = (levelNumber: number): GeneratedLevel | undefined => {
  if (levelNumber === 1) return buildLevel1();
  if (levelNumber === 5) return buildLayered(5, 8, 8, 10);
  if (levelNumber === 10) return buildLayered(10, 9, 9, 14, 'downShort');
  if (levelNumber === 25) return buildLayered(25, 10, 10, 16);
  if (levelNumber === 50) return buildLayered(50, 11, 11, 20);
  if (levelNumber === 75) return buildLayered(75, 11, 11, 24, 'downShort');
  if (levelNumber === 100) return buildLayered(100, 12, 12, 28);
  if (levelNumber === 150) return buildLayered(150, 13, 13, 34, 'downShort');
  if (levelNumber === 250) return buildLayered(250, 15, 15, 38);
  if (levelNumber === 350) return buildLayered(350, 16, 16, 50, 'rightLong');
  if (levelNumber === 450) return buildLayered(450, 16, 17, 56);
  if (levelNumber === 500) return buildLayered(500, 17, 17, 65);
  return undefined;
};

export const getV2QualityScore = (level: GeneratedLevel, profile: LevelDifficultyProfile) => {
  const openingRatio = level.metrics.initialValidMoves / Math.max(1, level.metrics.arrowCount);
  const targetOpening = (profile.openingFreeRatioRange[0] + profile.openingFreeRatioRange[1]) / 2;
  const targetDensity = (profile.densityRange[0] + profile.densityRange[1]) / 2;
  const targetDepth = (profile.dependencyDepthRange[0] + profile.dependencyDepthRange[1]) / 2;
  const openingFit = Math.max(0, 1 - Math.abs(openingRatio - targetOpening) / Math.max(0.12, targetOpening));
  const densityFit = Math.max(0, 1 - Math.abs(level.metrics.density - targetDensity) / Math.max(0.18, targetDensity));
  const depthFit = Math.min(1, level.metrics.dependencyDepth / Math.max(1, targetDepth));
  const turnFit = Math.min(1, level.metrics.averageTurns / Math.max(0.2, profile.turnComplexity[0]));
  const pathFit = Math.min(1, level.metrics.averagePathLength / Math.max(1, profile.pathLengthRange[0]));
  const scoreFit = Math.min(1, level.difficultyScore / Math.max(1, profile.targetDifficultyScore));
  return Math.round((openingFit * 22 + densityFit * 18 + depthFit * 20 + turnFit * 12 + pathFit * 10 + scoreFit * 18) * 10) / 10;
};
