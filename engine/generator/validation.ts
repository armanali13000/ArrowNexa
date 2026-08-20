import { buildOccupancyMap, cellKey } from '../occupancy';
import { PuzzleArrow, PuzzleLevel } from '../types/game';

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
