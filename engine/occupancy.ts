import { GridPoint, PuzzleArrow } from './types/game';

export type OccupancyMap = Map<string, string>;

export const cellKey = (point: GridPoint) => `${point.row},${point.col}`;

export const buildOccupancyMap = (arrows: PuzzleArrow[]): OccupancyMap => {
  const occupancy = new Map<string, string>();
  arrows.forEach((arrow) => {
    if (arrow.state === 'removed' || arrow.state === 'moving') return;
    arrow.path.forEach((point) => occupancy.set(cellKey(point), arrow.id));
  });
  return occupancy;
};

export const getOccupant = (occupancy: OccupancyMap, point: GridPoint) => occupancy.get(cellKey(point));
