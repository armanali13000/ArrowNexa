import { Direction, GeneratedLevel, GridPoint, PuzzleArrow, PuzzleLevel } from '../types/game';
import { analyzeDifficulty } from '../solver/difficulty';
import { denseReferenceLevel, testLevelOne, testLevelTwo, testLevelThree } from './testLevels';
import { GENERATION_VERSION } from './levelConfig';
import { cellKey } from '../occupancy';
import { createSeededRandom } from '../generator/seededRandom';
import { canArrowEscape, getArrowFacingDirection } from '../moves';

const fallbackByDifficulty = {
  Easy: testLevelOne,
  Normal: testLevelTwo,
  Hard: testLevelThree,
  Expert: denseReferenceLevel,
};

const fallbackShape = {
  Easy: { rows: 8, cols: 8, count: 12, minLength: 2, maxLength: 5, maxTurns: 1 },
  Normal: { rows: 11, cols: 11, count: 24, minLength: 2, maxLength: 6, maxTurns: 2 },
  Hard: { rows: 13, cols: 13, count: 38, minLength: 2, maxLength: 7, maxTurns: 3 },
  Expert: { rows: 16, cols: 16, count: 52, minLength: 2, maxLength: 8, maxTurns: 4 },
};

const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

const opposite: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

const step = (point: GridPoint, direction: Direction): GridPoint => {
  if (direction === 'UP') return { row: point.row - 1, col: point.col };
  if (direction === 'DOWN') return { row: point.row + 1, col: point.col };
  if (direction === 'LEFT') return { row: point.row, col: point.col - 1 };
  return { row: point.row, col: point.col + 1 };
};

const inside = (point: GridPoint, rows: number, cols: number) => point.row >= 0 && point.row < rows && point.col >= 0 && point.col < cols;

const borderHeads = (rows: number, cols: number) => {
  const heads: Array<{ head: GridPoint; direction: Direction }> = [];
  for (let col = 0; col < cols; col += 1) {
    heads.push({ head: { row: 0, col }, direction: 'UP' });
    heads.push({ head: { row: rows - 1, col }, direction: 'DOWN' });
  }
  for (let row = 1; row < rows - 1; row += 1) {
    heads.push({ head: { row, col: 0 }, direction: 'LEFT' });
    heads.push({ head: { row, col: cols - 1 }, direction: 'RIGHT' });
  }
  return heads;
};

const candidateHeads = (shape: typeof fallbackShape.Easy, difficulty: keyof typeof fallbackByDifficulty, random: ReturnType<typeof createSeededRandom>) => {
  const heads = borderHeads(shape.rows, shape.cols);
  const inset = difficulty === 'Easy' ? 1 : 2;
  for (let row = inset; row < shape.rows - inset; row += 1) {
    for (let col = inset; col < shape.cols - inset; col += 1) {
      directions.forEach((direction) => heads.push({ head: { row, col }, direction }));
    }
  }
  return random.shuffle(heads);
};

const placeArrow = (arrows: PuzzleArrow[], occupied: Set<string>, path: GridPoint[], direction: Direction, shape: typeof fallbackShape.Easy) => {
  const nextArrow: PuzzleArrow = {
    id: `fb-${String(arrows.length + 1).padStart(3, '0')}`,
    path,
    direction,
    state: 'normal',
    order: arrows.length + 1,
  };
  nextArrow.direction = getArrowFacingDirection(nextArrow);
  if (!canArrowEscape([...arrows, nextArrow], { rows: shape.rows, cols: shape.cols }, nextArrow.id).canEscape) return false;
  path.forEach((point) => occupied.add(cellKey(point)));
  arrows.push(nextArrow);
  return true;
};

const createCandidate = (
  head: GridPoint,
  direction: Direction,
  occupied: Set<string>,
  shape: typeof fallbackShape.Easy,
  random: ReturnType<typeof createSeededRandom>,
) => {
  if (occupied.has(cellKey(head))) return undefined;
  const targetLength = random.int(shape.minLength, shape.maxLength);
  const pathFromHead = [head];
  const used = new Set<string>([cellKey(head)]);
  let travel = opposite[direction];
  let turns = 0;

  while (pathFromHead.length < targetLength) {
    const canTurn = turns < shape.maxTurns && pathFromHead.length > 1;
    const turnOptions = directions.filter((candidate) => candidate !== travel && candidate !== opposite[travel]);
    const options = random.shuffle(canTurn && random.chance(0.46) ? [...turnOptions, travel] : [travel, ...turnOptions]);
    let nextPoint: GridPoint | undefined;
    let nextDirection = travel;

    for (const option of options) {
      const candidate = step(pathFromHead[pathFromHead.length - 1], option);
      const key = cellKey(candidate);
      if (inside(candidate, shape.rows, shape.cols) && !used.has(key) && !occupied.has(key)) {
        nextPoint = candidate;
        nextDirection = option;
        break;
      }
    }

    if (!nextPoint) break;
    if (nextDirection !== travel) turns += 1;
    travel = nextDirection;
    pathFromHead.push(nextPoint);
    used.add(cellKey(nextPoint));
  }

  if (pathFromHead.length < shape.minLength) return undefined;
  return pathFromHead.reverse();
};

const createDenseFallback = (levelNumber: number, difficulty: keyof typeof fallbackByDifficulty, seed: string): PuzzleLevel => {
  const shape = fallbackShape[difficulty];
  const random = createSeededRandom(`${seed}:fallback`);
  const occupied = new Set<string>();
  const arrows: PuzzleArrow[] = [];
  let passes = 0;

  if (difficulty === 'Hard' || difficulty === 'Expert') {
    for (const { head, direction } of candidateHeads(shape, difficulty, random)) {
      if (arrows.length >= shape.count) break;
      if (occupied.has(cellKey(head))) continue;

      const pathFromHead = [head];
      const targetLength = random.int(2, difficulty === 'Expert' ? 5 : 4);
      let cursor = head;
      for (let index = 1; index < targetLength; index += 1) {
        const canTurn = index > 1 && random.chance(difficulty === 'Expert' ? 0.62 : 0.48);
        const turnOptions = directions.filter((candidate) => candidate !== direction && candidate !== opposite[direction]);
        const options = canTurn ? random.shuffle([...turnOptions, opposite[direction]]) : [opposite[direction]];
        let next: GridPoint | undefined;
        for (const option of options) {
          const candidate = step(cursor, option);
          if (inside(candidate, shape.rows, shape.cols) && !occupied.has(cellKey(candidate)) && !pathFromHead.some((point) => point.row === candidate.row && point.col === candidate.col)) {
            next = candidate;
            break;
          }
        }
        if (!next) break;
        if (!inside(next, shape.rows, shape.cols) || occupied.has(cellKey(next))) break;
        pathFromHead.push(next);
        cursor = next;
      }

      if (pathFromHead.length < 2) continue;
      placeArrow(arrows, occupied, pathFromHead.reverse(), direction, shape);
    }
  }

  while (arrows.length < shape.count && passes < 6) {
    passes += 1;
    for (const { head, direction } of candidateHeads(shape, difficulty, random)) {
      if (arrows.length >= shape.count) break;
      const path = createCandidate(head, direction, occupied, shape, random);
      if (!path) continue;
      placeArrow(arrows, occupied, path, direction, shape);
    }
  }

  if (arrows.length < shape.count) {
    for (const { head, direction } of borderHeads(shape.rows, shape.cols)) {
      if (arrows.length >= shape.count) break;
      const inner = step(head, opposite[direction]);
      if (!inside(inner, shape.rows, shape.cols)) continue;
      if (occupied.has(cellKey(head)) || occupied.has(cellKey(inner))) continue;
      placeArrow(arrows, occupied, [inner, head], direction, shape);
    }
  }

  const source = arrows.length >= Math.max(4, Math.floor(shape.count * 0.55))
    ? {
        id: `dense-fallback-${difficulty.toLowerCase()}-${levelNumber}`,
        title: `Level ${levelNumber}`,
        size: { rows: shape.rows, cols: shape.cols },
        difficulty,
        arrows,
        solutionOrder: arrows.map((arrow) => arrow.id).reverse(),
      }
    : fallbackByDifficulty[difficulty];

  return source;
};

export const createFallbackLevel = (levelNumber: number, difficulty: keyof typeof fallbackByDifficulty, seed: string): GeneratedLevel => {
  const source = createDenseFallback(levelNumber, difficulty, seed);
  const level = {
    ...source,
    id: `fallback-${difficulty.toLowerCase()}-${levelNumber}`,
    title: `Level ${levelNumber}`,
    difficulty,
    levelNumber,
    generationVersion: GENERATION_VERSION,
    seed,
    generationAttempts: 0,
    generationDurationMs: 0,
  };
  const metrics = analyzeDifficulty(level);
  return {
    ...level,
    metrics,
    difficultyScore: metrics.complexityScore,
  };
};
