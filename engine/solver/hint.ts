import { markArrowRemoved } from '../moves';
import { PuzzleLevel } from '../types/game';
import { solveLevel } from './solveLevel';

export const getRecommendedMove = (level: PuzzleLevel, removedArrowIds: string[] = []) => {
  const result = solveLevel(level, { removedArrowIds, maxExploredStates: 12000 });
  return result.solution?.[0];
};
