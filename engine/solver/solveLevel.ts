import { getValidMoves, isBoardComplete, markArrowRemoved } from '../moves';
import { PuzzleArrow, PuzzleLevel, SolverResult } from '../types/game';

export type SolverOptions = {
  maxExploredStates?: number;
  removedArrowIds?: string[];
};

const makeStateKey = (arrows: PuzzleArrow[]) =>
  arrows
    .filter((arrow) => arrow.state === 'removed')
    .map((arrow) => arrow.id)
    .sort()
    .join('|');

export const solveLevel = (level: PuzzleLevel, options: SolverOptions = {}): SolverResult => {
  const maxExploredStates = options.maxExploredStates ?? 20000;
  const initialRemoved = new Set(options.removedArrowIds ?? []);
  const startArrows = level.arrows.map((arrow) => ({ ...arrow, state: initialRemoved.has(arrow.id) ? ('removed' as const) : ('normal' as const) }));
  const unsolvable = new Set<string>();
  let exploredStates = 0;
  let branchingTotal = 0;
  let branchingSamples = 0;
  let forcedMoves = 0;
  let maxDepth = 0;

  const search = (arrows: PuzzleArrow[], solution: string[]): string[] | undefined => {
    exploredStates += 1;
    maxDepth = Math.max(maxDepth, solution.length);
    if (exploredStates > maxExploredStates) return undefined;
    if (isBoardComplete(arrows)) return solution;

    const key = makeStateKey(arrows);
    if (unsolvable.has(key)) return undefined;

    const validMoves = getValidMoves(arrows, level.size);
    if (validMoves.length === 0) {
      unsolvable.add(key);
      return undefined;
    }

    branchingTotal += validMoves.length;
    branchingSamples += 1;
    if (validMoves.length === 1) forcedMoves += 1;

    const orderedMoves = [...validMoves].sort((left, right) => {
      const leftOrder = level.arrows.find((arrow) => arrow.id === left)?.order ?? 0;
      const rightOrder = level.arrows.find((arrow) => arrow.id === right)?.order ?? 0;
      return leftOrder - rightOrder;
    });

    for (const move of orderedMoves) {
      const solved = search(markArrowRemoved(arrows, move), [...solution, move]);
      if (solved) return solved;
    }
    unsolvable.add(key);
    return undefined;
  };

  const solution = search(startArrows, []);
  return {
    solvable: Boolean(solution),
    solution,
    exploredStates,
    solutionLength: solution?.length,
    branchingScore: branchingSamples ? branchingTotal / branchingSamples : 0,
    averageValidMoves: branchingSamples ? branchingTotal / branchingSamples : 0,
    forcedMoveRatio: branchingSamples ? forcedMoves / branchingSamples : 0,
    maxDepth,
  };
};

export const isDeadlocked = (level: PuzzleLevel, removedArrowIds: string[] = []) => {
  const removed = new Set(removedArrowIds);
  const arrows = level.arrows.map((arrow) => ({ ...arrow, state: removed.has(arrow.id) ? ('removed' as const) : ('normal' as const) }));
  return !isBoardComplete(arrows) && getValidMoves(arrows, level.size).length === 0;
};
