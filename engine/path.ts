import { GridPoint } from './types/game';

export const gridPointKey = (point: GridPoint) => `${point.row}:${point.col}`;
