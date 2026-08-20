import { cellKey } from '../occupancy';
import { Direction, GridPoint, LevelGenerationConfig } from '../types/game';
import { SeededRandom } from './seededRandom';

const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

const step = (point: GridPoint, direction: Direction): GridPoint => {
  if (direction === 'UP') return { row: point.row - 1, col: point.col };
  if (direction === 'DOWN') return { row: point.row + 1, col: point.col };
  if (direction === 'LEFT') return { row: point.row, col: point.col - 1 };
  return { row: point.row, col: point.col + 1 };
};

const opposite: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

const inside = (point: GridPoint, rows: number, cols: number) => point.row >= 0 && point.row < rows && point.col >= 0 && point.col < cols;

const borderHeads = (rows: number, cols: number) => {
  const heads: Array<{ head: GridPoint; direction: Direction }> = [];
  for (let col = 0; col < cols; col += 1) {
    heads.push({ head: { row: 0, col }, direction: 'UP' });
    heads.push({ head: { row: rows - 1, col }, direction: 'DOWN' });
  }
  for (let row = 0; row < rows; row += 1) {
    heads.push({ head: { row, col: 0 }, direction: 'LEFT' });
    heads.push({ head: { row, col: cols - 1 }, direction: 'RIGHT' });
  }
  return heads;
};

export const countTurns = (path: GridPoint[]) => {
  let turns = 0;
  for (let index = 2; index < path.length; index += 1) {
    const previous = path[index - 1];
    const before = path[index - 2];
    const current = path[index];
    const first = { row: previous.row - before.row, col: previous.col - before.col };
    const second = { row: current.row - previous.row, col: current.col - previous.col };
    if (first.row !== second.row || first.col !== second.col) turns += 1;
  }
  return turns;
};

export const generatePathCandidate = (config: LevelGenerationConfig, random: SeededRandom, occupied: Set<string>) => {
  const headChoice = random.pick(borderHeads(config.rows, config.cols));
  const targetLength = random.int(config.minPathLength, config.maxPathLength);
  const pathFromHead: GridPoint[] = [headChoice.head];
  const used = new Set<string>([cellKey(headChoice.head)]);
  let travelDirection = opposite[headChoice.direction];
  let turns = 0;

  while (pathFromHead.length < targetLength) {
    const canTurn = turns < config.maxTurnsPerArrow && random.chance(0.36 + config.maxTurnsPerArrow * 0.06);
    const options = random.shuffle(directions.filter((direction) => direction !== opposite[travelDirection]));
    if (canTurn) {
      options.sort((left) => (left === travelDirection ? 1 : -1));
    }

    let nextPoint: GridPoint | undefined;
    let nextDirection = travelDirection;
    for (const direction of options) {
      const candidate = step(pathFromHead[pathFromHead.length - 1], direction);
      const key = cellKey(candidate);
      if (inside(candidate, config.rows, config.cols) && !used.has(key) && !occupied.has(key)) {
        nextPoint = candidate;
        nextDirection = direction;
        break;
      }
    }
    if (!nextPoint) break;
    if (nextDirection !== travelDirection) turns += 1;
    travelDirection = nextDirection;
    pathFromHead.push(nextPoint);
    used.add(cellKey(nextPoint));
  }

  if (pathFromHead.length < config.minPathLength) return undefined;
  return {
    path: pathFromHead.reverse(),
    direction: headChoice.direction,
    turns,
  };
};
