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

export const calculateVisualCoverage = (arrows: PuzzleArrow[], rows: number, cols: number) => {
  const points = arrows.flatMap((arrow) => (arrow.state === 'removed' ? [] : arrow.path));
  if (points.length === 0) {
    return {
      usedAreaRatio: 0,
      widthRatio: 0,
      heightRatio: 0,
      centerOccupied: false,
      maxRegionShare: 1,
    };
  }

  const minRow = Math.min(...points.map((point) => point.row));
  const maxRow = Math.max(...points.map((point) => point.row));
  const minCol = Math.min(...points.map((point) => point.col));
  const maxCol = Math.max(...points.map((point) => point.col));
  const centerRows = [Math.floor((rows - 1) / 2), Math.ceil((rows - 1) / 2)];
  const centerCols = [Math.floor((cols - 1) / 2), Math.ceil((cols - 1) / 2)];
  const regions = { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0, center: 0 };

  points.forEach((point) => {
    const inCenter = centerRows.includes(point.row) && centerCols.includes(point.col);
    if (inCenter) regions.center += 1;
    else if (point.row < rows / 2 && point.col < cols / 2) regions.topLeft += 1;
    else if (point.row < rows / 2) regions.topRight += 1;
    else if (point.col < cols / 2) regions.bottomLeft += 1;
    else regions.bottomRight += 1;
  });

  return {
    usedAreaRatio: ((maxRow - minRow + 1) * (maxCol - minCol + 1)) / (rows * cols),
    widthRatio: (maxCol - minCol + 1) / cols,
    heightRatio: (maxRow - minRow + 1) / rows,
    centerOccupied: regions.center > 0 || points.some((point) => Math.abs(point.row - (rows - 1) / 2) <= 1 && Math.abs(point.col - (cols - 1) / 2) <= 1),
    maxRegionShare: Math.max(...Object.values(regions)) / Math.max(1, points.length),
  };
};
