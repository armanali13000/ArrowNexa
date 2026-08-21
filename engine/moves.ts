import { buildOccupancyMap, getOccupant } from './occupancy';
import { Direction, EscapeCheck, GridPoint, PuzzleArrow } from './types/game';

const nextPoint = (point: GridPoint, direction: Direction): GridPoint => {
  if (direction === 'UP') return { row: point.row - 1, col: point.col };
  if (direction === 'DOWN') return { row: point.row + 1, col: point.col };
  if (direction === 'LEFT') return { row: point.row, col: point.col - 1 };
  return { row: point.row, col: point.col + 1 };
};

const isInside = (point: GridPoint, size: { rows: number; cols: number }) =>
  point.row >= 0 && point.row < size.rows && point.col >= 0 && point.col < size.cols;

export const getArrowFacingDirection = (arrow: PuzzleArrow): Direction => {
  if (arrow.path.length < 2) return arrow.direction;
  const previous = arrow.path[arrow.path.length - 2];
  const head = arrow.path[arrow.path.length - 1];
  if (head.col > previous.col) return 'RIGHT';
  if (head.col < previous.col) return 'LEFT';
  if (head.row > previous.row) return 'DOWN';
  if (head.row < previous.row) return 'UP';
  return arrow.direction;
};

export const traceExitCells = (arrow: PuzzleArrow, size: { rows: number; cols: number }) => {
  const head = arrow.path[arrow.path.length - 1];
  const facingDirection = getArrowFacingDirection(arrow);
  const cells: GridPoint[] = [];
  let cursor = nextPoint(head, facingDirection);
  while (isInside(cursor, size)) {
    cells.push(cursor);
    cursor = nextPoint(cursor, facingDirection);
  }
  return cells;
};

export const canArrowEscape = (arrows: PuzzleArrow[], size: { rows: number; cols: number }, arrowId: string): EscapeCheck => {
  const arrow = arrows.find((item) => item.id === arrowId);
  if (!arrow || arrow.state === 'removed' || arrow.state === 'moving' || arrow.state === 'restoring') return { canEscape: false, checkedCells: [] };

  const occupancy = buildOccupancyMap(arrows);
  const checkedCells = traceExitCells(arrow, size);
  for (const cell of checkedCells) {
    const occupant = getOccupant(occupancy, cell);
    if (occupant && occupant !== arrow.id) return { canEscape: false, blockerId: occupant, checkedCells };
  }
  return { canEscape: true, checkedCells };
};

export const getBlockingArrow = (arrows: PuzzleArrow[], size: { rows: number; cols: number }, arrowId: string) =>
  canArrowEscape(arrows, size, arrowId).blockerId;

export const getValidMoves = (arrows: PuzzleArrow[], size: { rows: number; cols: number }) =>
  arrows
    .filter((arrow) => arrow.state !== 'removed' && arrow.state !== 'moving' && arrow.state !== 'restoring')
    .filter((arrow) => canArrowEscape(arrows, size, arrow.id).canEscape)
    .map((arrow) => arrow.id);

export const isBoardComplete = (arrows: PuzzleArrow[]) => arrows.every((arrow) => arrow.state === 'removed');

export const markArrowRemoved = (arrows: PuzzleArrow[], arrowId: string) =>
  arrows.map((arrow) => (arrow.id === arrowId ? { ...arrow, state: 'removed' as const } : arrow));
