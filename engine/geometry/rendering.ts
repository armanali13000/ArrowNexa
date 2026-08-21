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

const format = (value: number) => value.toFixed(2);

const distance = (a: PixelPoint, b: PixelPoint) => Math.hypot(a.x - b.x, a.y - b.y);

const pointBetween = (from: PixelPoint, to: PixelPoint, amount: number): PixelPoint => {
  const segmentLength = distance(from, to);
  if (segmentLength === 0) return from;
  const ratio = Math.min(0.5, amount / segmentLength);
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
  };
};

export const getArrowStrokeWidth = (cellSize: number) => Math.max(3.2, Math.min(6.6, cellSize * 0.13));

export const getVisualDirectionFromPath = (path: GridPoint[], fallback: Direction): Direction => {
  if (path.length < 2) return fallback;
  const previous = path[path.length - 2];
  const tip = path[path.length - 1];
  if (tip.col > previous.col) return 'RIGHT';
  if (tip.col < previous.col) return 'LEFT';
  if (tip.row > previous.row) return 'DOWN';
  if (tip.row < previous.row) return 'UP';
  return fallback;
};

export const createArrowSvgPath = (path: GridPoint[], cellSize: number, boardPadding: number) => {
  const points = path.map((point) => gridToPixel(point, cellSize, boardPadding));
  if (points.length <= 1) return '';
  if (points.length === 2) return `M ${format(points[0].x)} ${format(points[0].y)} L ${format(points[1].x)} ${format(points[1].y)}`;

  const cornerRadius = Math.min(cellSize * 0.16, 8);
  const commands = [`M ${format(points[0].x)} ${format(points[0].y)}`];

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const before = pointBetween(current, previous, cornerRadius);
    const after = pointBetween(current, next, cornerRadius);
    commands.push(`L ${format(before.x)} ${format(before.y)}`);
    commands.push(`Q ${format(current.x)} ${format(current.y)} ${format(after.x)} ${format(after.y)}`);
  }

  const last = points[points.length - 1];
  commands.push(`L ${format(last.x)} ${format(last.y)}`);
  return commands.join(' ');
};

export const createArrowHeadPath = (path: GridPoint[], direction: Direction, cellSize: number, boardPadding: number, strokeWidth = getArrowStrokeWidth(cellSize)) => {
  const paths = createArrowHeadStrokePaths(path, direction, cellSize, boardPadding, strokeWidth);
  return paths.join(' ');
};

export const createArrowHeadFillPath = (path: GridPoint[], direction: Direction, cellSize: number, boardPadding: number, strokeWidth = getArrowStrokeWidth(cellSize)) => {
  const tip = gridToPixel(path[path.length - 1], cellSize, boardPadding);
  const length = Math.max(strokeWidth * 2.55, cellSize * 0.24);
  const spread = Math.max(strokeWidth * 1.75, cellSize * 0.16);

  if (direction === 'UP') {
    return `M ${format(tip.x)} ${format(tip.y - strokeWidth * 0.2)} L ${format(tip.x - spread)} ${format(tip.y + length)} L ${format(tip.x + spread)} ${format(tip.y + length)} Z`;
  }
  if (direction === 'DOWN') {
    return `M ${format(tip.x)} ${format(tip.y + strokeWidth * 0.2)} L ${format(tip.x - spread)} ${format(tip.y - length)} L ${format(tip.x + spread)} ${format(tip.y - length)} Z`;
  }
  if (direction === 'LEFT') {
    return `M ${format(tip.x - strokeWidth * 0.2)} ${format(tip.y)} L ${format(tip.x + length)} ${format(tip.y - spread)} L ${format(tip.x + length)} ${format(tip.y + spread)} Z`;
  }
  return `M ${format(tip.x + strokeWidth * 0.2)} ${format(tip.y)} L ${format(tip.x - length)} ${format(tip.y - spread)} L ${format(tip.x - length)} ${format(tip.y + spread)} Z`;
};

export const createArrowHeadStrokePaths = (path: GridPoint[], direction: Direction, cellSize: number, boardPadding: number, strokeWidth = getArrowStrokeWidth(cellSize)) => {
  const tip = gridToPixel(path[path.length - 1], cellSize, boardPadding);
  const length = Math.max(strokeWidth * 2.35, cellSize * 0.2);
  const spread = Math.max(strokeWidth * 1.55, cellSize * 0.12);

  if (direction === 'UP') return [
    `M ${format(tip.x - spread)} ${format(tip.y + length)} L ${format(tip.x)} ${format(tip.y)}`,
    `M ${format(tip.x + spread)} ${format(tip.y + length)} L ${format(tip.x)} ${format(tip.y)}`,
  ];
  if (direction === 'DOWN') return [
    `M ${format(tip.x - spread)} ${format(tip.y - length)} L ${format(tip.x)} ${format(tip.y)}`,
    `M ${format(tip.x + spread)} ${format(tip.y - length)} L ${format(tip.x)} ${format(tip.y)}`,
  ];
  if (direction === 'LEFT') return [
    `M ${format(tip.x + length)} ${format(tip.y - spread)} L ${format(tip.x)} ${format(tip.y)}`,
    `M ${format(tip.x + length)} ${format(tip.y + spread)} L ${format(tip.x)} ${format(tip.y)}`,
  ];
  return [
    `M ${format(tip.x - length)} ${format(tip.y - spread)} L ${format(tip.x)} ${format(tip.y)}`,
    `M ${format(tip.x - length)} ${format(tip.y + spread)} L ${format(tip.x)} ${format(tip.y)}`,
  ];
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
