import { GridPoint } from '../types/game';

export const getBounds = (path: GridPoint[]) => ({
  minRow: Math.min(...path.map((point) => point.row)),
  maxRow: Math.max(...path.map((point) => point.row)),
  minCol: Math.min(...path.map((point) => point.col)),
  maxCol: Math.max(...path.map((point) => point.col)),
});
