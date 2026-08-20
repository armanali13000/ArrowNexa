import { Direction, GridPoint } from '../types/game';
import { getBounds } from './geometry';

export type PixelPoint = {
  x: number;
  y: number;
};

export const gridToPixel = (point: GridPoint, cellSize: number, boardPadding: number): PixelPoint => ({
  x: boardPadding + point.col * cellSize + cellSize / 2,
  y: boardPadding + point.row * cellSize + cellSize / 2,
});

export const createArrowSvgPath = (path: GridPoint[], cellSize: number, boardPadding: number) =>
  path
    .map((point, index) => {
      const pixel = gridToPixel(point, cellSize, boardPadding);
      return `${index === 0 ? 'M' : 'L'} ${pixel.x.toFixed(2)} ${pixel.y.toFixed(2)}`;
    })
    .join(' ');

export const createArrowHeadPath = (path: GridPoint[], direction: Direction, cellSize: number, boardPadding: number) => {
  const tip = gridToPixel(path[path.length - 1], cellSize, boardPadding);
  const size = Math.max(6, cellSize * 0.28);
  const spread = size * 0.72;
  if (direction === 'UP') return `M ${(tip.x - spread).toFixed(2)} ${(tip.y + size).toFixed(2)} L ${tip.x.toFixed(2)} ${(tip.y - size * 0.25).toFixed(2)} L ${(tip.x + spread).toFixed(2)} ${(tip.y + size).toFixed(2)}`;
  if (direction === 'DOWN') return `M ${(tip.x - spread).toFixed(2)} ${(tip.y - size).toFixed(2)} L ${tip.x.toFixed(2)} ${(tip.y + size * 0.25).toFixed(2)} L ${(tip.x + spread).toFixed(2)} ${(tip.y - size).toFixed(2)}`;
  if (direction === 'LEFT') return `M ${(tip.x + size).toFixed(2)} ${(tip.y - spread).toFixed(2)} L ${(tip.x - size * 0.25).toFixed(2)} ${tip.y.toFixed(2)} L ${(tip.x + size).toFixed(2)} ${(tip.y + spread).toFixed(2)}`;
  return `M ${(tip.x - size).toFixed(2)} ${(tip.y - spread).toFixed(2)} L ${(tip.x + size * 0.25).toFixed(2)} ${tip.y.toFixed(2)} L ${(tip.x - size).toFixed(2)} ${(tip.y + spread).toFixed(2)}`;
};

export const getEscapeTranslation = (
  path: GridPoint[],
  direction: Direction,
  cellSize: number,
  boardPadding: number,
  boardSize: number,
) => {
  const bounds = getBounds(path);
  const minX = boardPadding + bounds.minCol * cellSize;
  const maxX = boardPadding + (bounds.maxCol + 1) * cellSize;
  const minY = boardPadding + bounds.minRow * cellSize;
  const maxY = boardPadding + (bounds.maxRow + 1) * cellSize;
  const margin = cellSize * 1.5;

  if (direction === 'RIGHT') return { x: boardSize - minX + margin, y: 0 };
  if (direction === 'LEFT') return { x: -(maxX + margin), y: 0 };
  if (direction === 'DOWN') return { x: 0, y: boardSize - minY + margin };
  return { x: 0, y: -(maxY + margin) };
};
