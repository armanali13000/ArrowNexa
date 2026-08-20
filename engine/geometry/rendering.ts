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
  const size = Math.max(5, cellSize * 0.24);
  if (direction === 'UP') return `M ${tip.x} ${tip.y - size} L ${tip.x - size * 0.72} ${tip.y + size * 0.54} L ${tip.x + size * 0.72} ${tip.y + size * 0.54} Z`;
  if (direction === 'DOWN') return `M ${tip.x} ${tip.y + size} L ${tip.x - size * 0.72} ${tip.y - size * 0.54} L ${tip.x + size * 0.72} ${tip.y - size * 0.54} Z`;
  if (direction === 'LEFT') return `M ${tip.x - size} ${tip.y} L ${tip.x + size * 0.54} ${tip.y - size * 0.72} L ${tip.x + size * 0.54} ${tip.y + size * 0.72} Z`;
  return `M ${tip.x + size} ${tip.y} L ${tip.x - size * 0.54} ${tip.y - size * 0.72} L ${tip.x - size * 0.54} ${tip.y + size * 0.72} Z`;
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
