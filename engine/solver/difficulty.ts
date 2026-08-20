import { calculateDensity } from '../generator/density';
import { countTurns } from '../generator/pathGenerator';
import { getBlockingArrow, getValidMoves, markArrowRemoved } from '../moves';
import { classifyDifficulty } from '../levels/levelConfig';
import { DifficultyMetrics, PuzzleLevel } from '../types/game';
import { solveLevel } from './solveLevel';

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export const analyzeDifficulty = (level: PuzzleLevel): DifficultyMetrics => {
  const solver = solveLevel(level, { maxExploredStates: 30000 });
  const solution = solver.solution ?? [];
  const density = calculateDensity(level.arrows, level.size.rows, level.size.cols);
  const initialValidMoves = getValidMoves(level.arrows, level.size).length;
  const turns = level.arrows.map((arrow) => countTurns(arrow.path));
  const dependencyDepth = getDependencyDepth(level);
  const averagePathLength = level.arrows.reduce((sum, arrow) => sum + arrow.path.length, 0) / Math.max(1, level.arrows.length);
  const averageTurns = turns.reduce((sum, turnCount) => sum + turnCount, 0) / Math.max(1, turns.length);
  const averageValidMoves = solver.averageValidMoves ?? 0;
  const forcedMoveRatio = solver.forcedMoveRatio ?? 0;
  const branchingScore = solver.branchingScore ?? 0;
  const complexityScore = clamp(
    density.density * 34 +
      level.arrows.length * 0.82 +
      (level.size.rows + level.size.cols) * 0.55 +
      averagePathLength * 2.1 +
      averageTurns * 6 +
      dependencyDepth * 4.2 +
      solution.length * 0.36 +
      Math.max(0, 5 - initialValidMoves) * 2.5 +
      forcedMoveRatio * 8 +
      Math.min(12, branchingScore) * 1.2,
  );

  return {
    arrowCount: level.arrows.length,
    occupiedCells: density.occupiedCells,
    density: density.density,
    solutionDepth: solution.length,
    initialValidMoves,
    averageValidMoves,
    dependencyDepth,
    branchingScore,
    forcedMoveRatio,
    averagePathLength,
    averageTurns,
    complexityScore,
  };
};

export const classifyAnalyzedDifficulty = (metrics: DifficultyMetrics) => classifyDifficulty(metrics.complexityScore);

const getDependencyDepth = (level: PuzzleLevel) => {
  let arrows = level.arrows.map((arrow) => ({ ...arrow }));
  let maxDepth = 0;
  for (const target of level.arrows) {
    let depth = 0;
    const seen = new Set<string>();
    let cursor = target.id;
    while (cursor && !seen.has(cursor)) {
      seen.add(cursor);
      const blocker = getBlockingArrow(arrows, level.size, cursor);
      if (!blocker) break;
      depth += 1;
      cursor = blocker;
    }
    maxDepth = Math.max(maxDepth, depth);
    arrows = markArrowRemoved(arrows, target.id);
  }
  return maxDepth;
};
