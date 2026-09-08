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
type ConstructionFamily =
  | 'tutorial-open'
  | 'simple-chain'
  | 'staggered-chain'
  | 'double-chain'
  | 'fork'
  | 'reverse-fork'
  | 'nested-blockers'
  | 'layered-blockers'
  | 'dual-opening'
  | 'triple-opening'
  | 'converging-branches'
  | 'diverging-branches'
  | 'alternating-chain'
  | 'asymmetric-layered'
  | 'central-dependency'
  | 'edge-to-center'
  | 'center-to-edge'
  | 'mixed-topology';

const constructionFamilies: ConstructionFamily[] = [
  'simple-chain',
  'staggered-chain',
  'double-chain',
  'fork',
  'reverse-fork',
  'nested-blockers',
  'layered-blockers',
  'dual-opening',
  'triple-opening',
  'converging-branches',
  'diverging-branches',
  'alternating-chain',
  'asymmetric-layered',
  'central-dependency',
  'edge-to-center',
  'center-to-edge',
  'mixed-topology',
];

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
  family: ConstructionFamily = 'layered-blockers',
  variant = 0,
) => {
  const arrows: PuzzleArrow[] = [];
  let order = 1;

  const cells: Array<[number, number]> = [];
  const rowOffset = variant > 0 && (family === 'edge-to-center' || family === 'center-to-edge' || variant % 3 === 1) ? variant % 2 : 0;
  const colOffset = variant > 0 && (family === 'asymmetric-layered' || family === 'mixed-topology' || variant % 4 === 2) ? Math.floor(variant / 2) % 2 : 0;
  for (let row = rowOffset; row + 1 < rows; row += 2) {
    for (let col = colOffset; col + 1 < cols; col += 2) cells.push([row, col]);
  }

  const orderedCells = [...cells].sort(([leftRow, leftCol], [rightRow, rightCol]) => {
    if (family === 'center-to-edge' || family === 'central-dependency') {
      const centerRow = (rows - 1) / 2;
      const centerCol = (cols - 1) / 2;
      const leftDistance = Math.abs(leftRow - centerRow) + Math.abs(leftCol - centerCol);
      const rightDistance = Math.abs(rightRow - centerRow) + Math.abs(rightCol - centerCol);
      return leftDistance - rightDistance || leftRow - rightRow || leftCol - rightCol;
    }
    if (family === 'edge-to-center') {
      const centerRow = (rows - 1) / 2;
      const centerCol = (cols - 1) / 2;
      const leftDistance = Math.abs(leftRow - centerRow) + Math.abs(leftCol - centerCol);
      const rightDistance = Math.abs(rightRow - centerRow) + Math.abs(rightCol - centerCol);
      return rightDistance - leftDistance || leftRow - rightRow || leftCol - rightCol;
    }
    if (family === 'staggered-chain' || family === 'converging-branches') return leftCol - rightCol || leftRow - rightRow;
    return leftRow - rightRow || leftCol - rightCol;
  });

  const start = family === 'reverse-fork' || family === 'diverging-branches'
    ? Math.max(0, orderedCells.length - targetCount)
    : Math.min(Math.max(0, variant % Math.max(1, orderedCells.length - targetCount + 1)), Math.max(0, orderedCells.length - targetCount));
  const selected = orderedCells.slice(start, start + targetCount);
  const patternCycle: LayeredPattern[] = pattern === 'rightShort' || pattern === 'rightLong'
    ? ['rightShort', 'rightLong']
    : ['downShort', 'downLong'];

  for (const [row, col] of selected) {
    const tilePattern = family === 'alternating-chain' || family === 'mixed-topology' || family === 'asymmetric-layered'
      ? patternCycle[(order + variant) % patternCycle.length]
      : pattern;
    arrows.push(arrow(`v2-${levelNumber}-t-${String(order).padStart(3, '0')}`, cellsForTile(row, col, tilePattern), order));
      order += 1;
  }

  return makeGenerated(levelNumber, rows, cols, arrows, 1);
};

const familyFor = (levelNumber: number, variant = 0): ConstructionFamily => {
  if (levelNumber === 1) return 'tutorial-open';
  if (levelNumber <= 5) return 'simple-chain';
  const chapter = Math.floor((levelNumber - 1) / 50) + 1;
  const chapterLevel = ((levelNumber - 1) % 50) + 1;
  if (chapterLevel === 50) return chapter % 2 === 0 ? 'converging-branches' : 'layered-blockers';
  return constructionFamilies[(levelNumber * 7 + chapter * 3 + Math.floor(chapterLevel / 4) + variant * 5) % constructionFamilies.length];
};

const patternFor = (family: ConstructionFamily, levelNumber: number): LayeredPattern => {
  if (family === 'staggered-chain' || family === 'fork' || family === 'dual-opening' || family === 'converging-branches') return 'downShort';
  if (family === 'reverse-fork' || family === 'center-to-edge') return levelNumber >= 200 ? 'rightLong' : 'rightShort';
  if (family === 'nested-blockers' || family === 'edge-to-center' || family === 'diverging-branches') return levelNumber >= 200 ? 'downLong' : 'downShort';
  if (levelNumber >= 200) return levelNumber % 2 === 0 ? 'downLong' : 'rightLong';
  return levelNumber % 2 === 0 ? 'downShort' : 'rightShort';
};

const buildScaled = (levelNumber: number, variant = 0) => {
  const profile = getLevelDifficultyProfile(levelNumber);
  const family = familyFor(levelNumber, variant);
  const progress = (levelNumber - 1) / 499;
  const chapterLevel = ((levelNumber - 1) % 50) + 1;
  const range = profile.arrowCountRange[1] - profile.arrowCountRange[0];
  const wave = ((levelNumber * 13 + variant * 5) % 9) / 8;
  const finaleBoost = chapterLevel === 50 ? 1 : 0;
  const targetCount = Math.round(profile.arrowCountRange[0] + range * Math.min(1, Math.max(0.28, wave * 0.62 + progress * 0.28 + finaleBoost * 0.3)));
  const pathLength = progress >= 0.42 ? 4 : 3;
  const targetDensity = (profile.densityRange[0] + profile.densityRange[1]) / 2;
  const side = Math.ceil(Math.sqrt((targetCount * pathLength) / Math.max(0.34, targetDensity)));
  const rows = Math.max(8, Math.min(18, side + ((levelNumber + variant) % 3 === 0 ? 1 : 0)));
  const cols = Math.max(8, Math.min(18, side + ((levelNumber + variant) % 4 === 0 ? 1 : 0)));
  const pattern = patternFor(family, levelNumber);
  return buildLayered(levelNumber, rows, cols, targetCount, pattern, family, variant);
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

export const createConstructiveV2Level = (levelNumber: number, variant = 0): GeneratedLevel | undefined => {
  if (levelNumber === 1) return buildLevel1();
  if (variant > 0 && (levelNumber === 5 || levelNumber === 10 || levelNumber === 25 || levelNumber === 50 || levelNumber === 75 || levelNumber === 100 || levelNumber === 150 || levelNumber === 250 || levelNumber === 350 || levelNumber === 450 || levelNumber === 500)) {
    return buildScaled(levelNumber, variant);
  }
  if (levelNumber === 5) return buildLayered(5, 8, 8, 10);
  if (levelNumber === 10) return buildLayered(10, 9, 9, 14, 'downShort');
  if (levelNumber === 25) return buildLayered(25, 10, 10, 16);
  if (levelNumber === 50) return buildLayered(50, 11, 11, 20);
  if (levelNumber === 75) return buildLayered(75, 11, 11, 24, 'downShort');
  if (levelNumber === 100) return buildLayered(100, 12, 12, 28);
  if (levelNumber === 150) return buildLayered(150, 13, 13, 34, 'downShort');
  if (levelNumber === 250) return buildLayered(250, 16, 16, 46);
  if (levelNumber === 350) return buildLayered(350, 16, 16, 50, 'rightLong');
  if (levelNumber === 450) return buildLayered(450, 18, 18, 67);
  if (levelNumber === 500) return buildLayered(500, 18, 18, 72);
  return buildScaled(levelNumber, variant);
};

export const getConstructiveV2Family = (levelNumber: number, variant = 0): ConstructionFamily => familyFor(levelNumber, variant);

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
