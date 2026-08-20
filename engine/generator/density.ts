import { cellKey } from '../occupancy';
import { PuzzleArrow } from '../types/game';

export const calculateDensity = (arrows: PuzzleArrow[], rows: number, cols: number) => {
  const occupied = new Set<string>();
  arrows.forEach((arrow) => {
    if (arrow.state === 'removed') return;
    arrow.path.forEach((point) => occupied.add(cellKey(point)));
  });
  return {
    occupiedCells: occupied.size,
    density: occupied.size / (rows * cols),
  };
};

export const getUsedAreaRatio = (arrows: PuzzleArrow[], rows: number, cols: number) => {
  const points = arrows.flatMap((arrow) => arrow.path);
  if (points.length === 0) return 0;
  const minRow = Math.min(...points.map((point) => point.row));
  const maxRow = Math.max(...points.map((point) => point.row));
  const minCol = Math.min(...points.map((point) => point.col));
  const maxCol = Math.max(...points.map((point) => point.col));
  return ((maxRow - minRow + 1) * (maxCol - minCol + 1)) / (rows * cols);
};
