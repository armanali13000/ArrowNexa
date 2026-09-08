import { buildOccupancyMap, cellKey } from '../occupancy';
import { calculateVisualCoverage } from './density';
import { countTurns } from './pathGenerator';
import { getValidMoves } from '../moves';
import { DifficultyMetrics, PuzzleArrow, PuzzleLevel } from '../types/game';

const areAdjacent = (left: { row: number; col: number }, right: { row: number; col: number }) =>
  Math.abs(left.row - right.row) + Math.abs(left.col - right.col) === 1;

export const validateArrowGeometry = (arrow: PuzzleArrow, rows: number, cols: number) => {
  const used = new Set<string>();
  for (let index = 0; index < arrow.path.length; index += 1) {
    const point = arrow.path[index];
    if (point.row < 0 || point.row >= rows || point.col < 0 || point.col >= cols) return false;
    const key = cellKey(point);
    if (used.has(key)) return false;
    used.add(key);
    if (index > 0 && !areAdjacent(arrow.path[index - 1], point)) return false;
  }
  return arrow.path.length >= 2;
};

export const validateLevelGeometry = (level: PuzzleLevel) => {
  if (level.arrows.some((arrow) => !validateArrowGeometry(arrow, level.size.rows, level.size.cols))) return false;
  const occupiedCells = level.arrows.reduce((sum, arrow) => sum + arrow.path.length, 0);
  return buildOccupancyMap(level.arrows).size === occupiedCells;
};

const chapterFor = (levelNumber = 1) => Math.floor((Math.max(1, Math.min(500, levelNumber)) - 1) / 50) + 1;
const chapterLevelFor = (levelNumber = 1) => ((Math.max(1, Math.min(500, levelNumber)) - 1) % 50) + 1;

export const getQualityTargets = (levelNumber = 1) => {
  const chapter = chapterFor(levelNumber);
  const chapterLevel = chapterLevelFor(levelNumber);
  const progress = (chapter - 1) / 9;
  const chapterProgress = (chapterLevel - 1) / 49;
  const finaleBoost = chapterLevel === 50 ? 0.09 : 0;
  return {
    minDensity: Math.min(0.64, 0.25 + progress * 0.3 + chapterProgress * 0.05 + finaleBoost),
    maxOpeningShare: Math.max(0.1, 0.58 - progress * 0.35 - chapterProgress * 0.08 - finaleBoost),
    minDependencyDepth: Math.floor(1 + progress * 6 + chapterProgress * 2 + (chapterLevel === 50 ? 2 : 0)),
    minAverageTurns: Math.min(2.6, 0.25 + progress * 1.55 + chapterProgress * 0.45),
    minAveragePathLength: Math.min(7.2, 2.5 + progress * 3.1 + chapterProgress * 0.8),
    minCoverage: Math.min(0.88, 0.54 + progress * 0.26 + chapterProgress * 0.08),
  };
};

export const validateVisualQuality = (level: PuzzleLevel & { levelNumber?: number }) => {
  const targets = getQualityTargets(level.levelNumber);
  const coverage = calculateVisualCoverage(level.arrows, level.size.rows, level.size.cols);
  const occupied = buildOccupancyMap(level.arrows).size;
  const density = occupied / (level.size.rows * level.size.cols);
  const turns = level.arrows.map((arrow) => countTurns(arrow.path));
  const averageTurns = turns.reduce((sum, value) => sum + value, 0) / Math.max(1, turns.length);
  const averagePathLength = level.arrows.reduce((sum, arrow) => sum + arrow.path.length, 0) / Math.max(1, level.arrows.length);
  const turnKinds = new Set(turns.map((turn) => Math.min(3, turn))).size;

  if (density < targets.minDensity * 0.82) return false;
  if (coverage.usedAreaRatio < targets.minCoverage) return false;
  if (coverage.widthRatio < 0.72 || coverage.heightRatio < 0.72) return false;
  if (chapterFor(level.levelNumber) >= 3 && !coverage.centerOccupied) return false;
  if (coverage.maxRegionShare > 0.62) return false;
  if (averagePathLength < targets.minAveragePathLength * 0.72) return false;
  if (chapterFor(level.levelNumber) >= 5 && averageTurns < targets.minAverageTurns * 0.55) return false;
  if (chapterFor(level.levelNumber) >= 5 && turnKinds < 2) return false;
  return true;
};

export const validatePuzzleQuality = (level: PuzzleLevel & { levelNumber?: number }, metrics: DifficultyMetrics) => {
  const targets = getQualityTargets(level.levelNumber);
  const openingMoves = getValidMoves(level.arrows, level.size).length;
  const openingShare = openingMoves / Math.max(1, level.arrows.length);
  const chapter = chapterFor(level.levelNumber);
  const chapterLevel = chapterLevelFor(level.levelNumber);

  if (metrics.solutionDepth !== level.arrows.length) return false;
  if (openingShare > targets.maxOpeningShare) return false;
  if (chapter >= 2 && metrics.dependencyDepth < Math.max(1, targets.minDependencyDepth * 0.5)) return false;
  if (chapter >= 4 && metrics.averageValidMoves > Math.max(9, level.arrows.length * 0.42)) return false;
  if (chapter >= 7 && metrics.initialValidMoves > Math.max(10, Math.floor(level.arrows.length * 0.28))) return false;
  if (chapterLevel === 50 && metrics.complexityScore < targets.minDependencyDepth * 7) return false;
  return true;
};
