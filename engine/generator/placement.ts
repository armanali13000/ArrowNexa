import { buildOccupancyMap, cellKey } from '../occupancy';
import { canArrowEscape } from '../moves';
import { PuzzleArrow } from '../types/game';

export const canPlaceWithoutOverlap = (candidate: PuzzleArrow, arrows: PuzzleArrow[]) => {
  const occupied = buildOccupancyMap(arrows);
  return candidate.path.every((point) => !occupied.has(cellKey(point)));
};

export const preservesExistingSolutionPrefix = (candidate: PuzzleArrow, arrows: PuzzleArrow[], size: { rows: number; cols: number }) => {
  const next = [...arrows, candidate];
  return arrows.every((arrow) => canArrowEscape(next, size, arrow.id).canEscape);
};
