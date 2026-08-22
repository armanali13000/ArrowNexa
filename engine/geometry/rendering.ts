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

const polylineLength = (points: PixelPoint[]) => {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += distance(points[index - 1], points[index]);
  }
  return total;
};

const pointAtDistance = (points: PixelPoint[], targetDistance: number) => {
  let traveled = 0;
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const segmentLength = distance(start, end);
    if (traveled + segmentLength >= targetDistance) {
      const ratio = segmentLength === 0 ? 0 : (targetDistance - traveled) / segmentLength;
      return {
        point: {
          x: start.x + (end.x - start.x) * ratio,
          y: start.y + (end.y - start.y) * ratio,
        },
        direction: directionBetween(start, end),
      };
    }
    traveled += segmentLength;
  }
  const fallbackStart = points[Math.max(0, points.length - 2)];
  const fallbackEnd = points[points.length - 1];
  return { point: fallbackEnd, direction: directionBetween(fallbackStart, fallbackEnd) };
};

const directionBetween = (start: PixelPoint, end: PixelPoint): Direction => {
  if (Math.abs(end.x - start.x) >= Math.abs(end.y - start.y)) return end.x >= start.x ? 'RIGHT' : 'LEFT';
  return end.y >= start.y ? 'DOWN' : 'UP';
};

const slicePolyline = (points: PixelPoint[], startDistance: number, endDistance: number) => {
  const totalLength = polylineLength(points);
  const start = Math.max(0, Math.min(totalLength, startDistance));
  const end = Math.max(start, Math.min(totalLength, endDistance));
  const sliced: PixelPoint[] = [pointAtDistance(points, start).point];
  let traveled = 0;

  for (let index = 1; index < points.length; index += 1) {
    const segmentStart = points[index - 1];
    const segmentEnd = points[index];
    const segmentLength = distance(segmentStart, segmentEnd);
    const segmentStartDistance = traveled;
    const segmentEndDistance = traveled + segmentLength;
    if (segmentEndDistance > start && segmentEndDistance < end) sliced.push(segmentEnd);
    traveled = segmentEndDistance;
  }

  sliced.push(pointAtDistance(points, end).point);
  return sliced.filter((point, index, items) => index === 0 || distance(point, items[index - 1]) > 0.1);
};

const buildFollowerPoints = (route: PixelPoint[], bodyLength: number, progress: number, cellSize: number) => {
  const routeLength = polylineLength(route);
  const clampedHeadDistance = Math.max(bodyLength, Math.min(routeLength, bodyLength + progress));
  const steps = Math.max(4, Math.ceil(bodyLength / Math.max(1, cellSize * 0.33)) + 1);
  const spacing = bodyLength / (steps - 1);
  const points: PixelPoint[] = [];

  for (let index = steps - 1; index >= 0; index -= 1) {
    const sampleDistance = clampedHeadDistance - spacing * index;
    points.push(pointAtDistance(route, sampleDistance).point);
  }

  return points.filter((point, index, items) => index === 0 || distance(point, items[index - 1]) > 0.1);
};

const pointBetween = (from: PixelPoint, to: PixelPoint, amount: number): PixelPoint => {
  const segmentLength = distance(from, to);
  if (segmentLength === 0) return from;
  const ratio = Math.min(0.5, amount / segmentLength);
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
  };
};

export const getArrowStrokeWidth = (cellSize: number) => Math.max(3.6, Math.min(7.4, cellSize * 0.145));

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
  return createPixelSvgPath(points, cellSize);
};

const createPixelSvgPath = (points: PixelPoint[], cellSize: number) => {
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
  return createArrowHeadFillPathAt(tip, direction, cellSize, strokeWidth);
};

export const createArrowHeadFillPathAt = (tip: PixelPoint, direction: Direction, cellSize: number, strokeWidth = getArrowStrokeWidth(cellSize)) => {
  const length = Math.max(strokeWidth * 2.35, cellSize * 0.23);
  const spread = Math.max(strokeWidth * 1.55, cellSize * 0.145);
  const forward = strokeWidth * 0.72;

  if (direction === 'UP') {
    return `M ${format(tip.x)} ${format(tip.y - forward)} L ${format(tip.x - spread)} ${format(tip.y + length)} L ${format(tip.x + spread)} ${format(tip.y + length)} Z`;
  }
  if (direction === 'DOWN') {
    return `M ${format(tip.x)} ${format(tip.y + forward)} L ${format(tip.x - spread)} ${format(tip.y - length)} L ${format(tip.x + spread)} ${format(tip.y - length)} Z`;
  }
  if (direction === 'LEFT') {
    return `M ${format(tip.x - forward)} ${format(tip.y)} L ${format(tip.x + length)} ${format(tip.y - spread)} L ${format(tip.x + length)} ${format(tip.y + spread)} Z`;
  }
  return `M ${format(tip.x + forward)} ${format(tip.y)} L ${format(tip.x - length)} ${format(tip.y - spread)} L ${format(tip.x - length)} ${format(tip.y + spread)} Z`;
};

export const getSnakeEscapeGeometry = (
  path: GridPoint[],
  direction: Direction,
  progress: number,
  cellSize: number,
  boardPadding: number,
  boardSize: number,
  strokeWidth = getArrowStrokeWidth(cellSize),
) => {
  const originalPoints = path.map((point) => gridToPixel(point, cellSize, boardPadding));
  const head = originalPoints[originalPoints.length - 1];
  const bodyLength = Math.max(cellSize, polylineLength(originalPoints));
  const outsideDistance = bodyLength + boardSize + cellSize * 2;
  const outsidePoint =
    direction === 'RIGHT'
      ? { x: head.x + outsideDistance, y: head.y }
      : direction === 'LEFT'
        ? { x: head.x - outsideDistance, y: head.y }
        : direction === 'DOWN'
          ? { x: head.x, y: head.y + outsideDistance }
          : { x: head.x, y: head.y - outsideDistance };
  const route = [...originalPoints, outsidePoint];
  const routeLength = polylineLength(route);
  const maxProgress = Math.max(0, routeLength - bodyLength);
  const clampedProgress = Math.max(0, Math.min(maxProgress, progress));
  const visiblePoints = buildFollowerPoints(route, bodyLength, clampedProgress, cellSize);
  const headSample = pointAtDistance(route, clampedProgress + bodyLength);

  return {
    shaftPath: createPixelSvgPath(visiblePoints, cellSize),
    headPath: createArrowHeadFillPathAt(headSample.point, headSample.direction, cellSize, strokeWidth),
    maxProgress,
  };
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
