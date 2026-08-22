import { validateLevelGeometry } from '../generator/validation';
import { canArrowEscape, getArrowFacingDirection, isBoardComplete, markArrowRemoved } from '../moves';
import { Direction, GeneratedLevel, PuzzleArrow, PuzzleLevel } from '../types/game';
import { analyzeDifficulty } from '../solver/difficulty';
import { GENERATION_VERSION } from './levelConfig';

type ThemedArrow = {
  path: Array<[number, number]>;
  direction: Direction;
};

type ThemedTemplate = {
  id: string;
  title: string;
  levelNumbers: number[];
  size: PuzzleLevel['size'];
  difficulty: PuzzleLevel['difficulty'];
  arrows: ThemedArrow[];
};

const cellKey = ([row, col]: [number, number]) => `${row},${col}`;

const isConnectedPath = (path: Array<[number, number]>) =>
  path.length >= 2 &&
  path.every(([row, col], index) => {
    if (index === 0) return true;
    const [previousRow, previousCol] = path[index - 1];
    return Math.abs(previousRow - row) + Math.abs(previousCol - col) === 1;
  });

const buildArrow = (templateId: string, index: number, item: ThemedArrow): PuzzleArrow => {
  const arrow: PuzzleArrow = {
    id: `theme-${templateId}-${String(index + 1).padStart(2, '0')}`,
    path: item.path.map(([row, col]) => ({ row, col })),
    direction: item.direction,
    state: 'normal',
    order: index + 1,
  };
  return { ...arrow, direction: getArrowFacingDirection(arrow) };
};

const sanitizeTemplateArrows = (template: ThemedTemplate) => {
  const used = new Set<string>();
  const clean: ThemedArrow[] = [];
  for (const arrow of template.arrows) {
    if (!isConnectedPath(arrow.path)) continue;
    if (arrow.path.some((point) => point[0] < 0 || point[0] >= template.size.rows || point[1] < 0 || point[1] >= template.size.cols)) continue;
    if (arrow.path.some((point) => used.has(cellKey(point)))) continue;
    arrow.path.forEach((point) => used.add(cellKey(point)));
    clean.push(arrow);
  }
  return clean.map((arrow, index) => buildArrow(template.id, index, arrow));
};

const templates: ThemedTemplate[] = [
  {
    id: 'heart',
    title: 'Heart Routes',
    levelNumbers: [35, 135, 235, 335, 435],
    size: { rows: 11, cols: 11 },
    difficulty: 'Normal',
    arrows: [
      { path: [[2, 2], [1, 2], [1, 3], [0, 3]], direction: 'UP' },
      { path: [[2, 8], [1, 8], [1, 7], [0, 7]], direction: 'UP' },
      { path: [[3, 0], [4, 0], [5, 0]], direction: 'DOWN' },
      { path: [[3, 10], [4, 10], [5, 10]], direction: 'DOWN' },
      { path: [[5, 1], [5, 2], [6, 2]], direction: 'DOWN' },
      { path: [[5, 9], [5, 8], [6, 8]], direction: 'DOWN' },
      { path: [[7, 3], [7, 4], [8, 4]], direction: 'DOWN' },
      { path: [[7, 7], [7, 6], [8, 6]], direction: 'DOWN' },
      { path: [[9, 4], [10, 4]], direction: 'DOWN' },
      { path: [[9, 6], [10, 6]], direction: 'DOWN' },
      { path: [[4, 4], [4, 5], [4, 6]], direction: 'RIGHT' },
    ],
  },
  {
    id: 'key',
    title: 'Key Turn',
    levelNumbers: [60, 160, 260, 360, 460],
    size: { rows: 12, cols: 12 },
    difficulty: 'Hard',
    arrows: [
      { path: [[1, 1], [1, 2], [1, 3], [1, 4]], direction: 'RIGHT' },
      { path: [[2, 1], [3, 1], [4, 1]], direction: 'DOWN' },
      { path: [[4, 2], [4, 3], [4, 4], [4, 5]], direction: 'RIGHT' },
      { path: [[2, 5], [3, 5]], direction: 'DOWN' },
      { path: [[3, 6], [3, 7], [3, 8], [3, 9], [3, 10], [3, 11]], direction: 'RIGHT' },
      { path: [[5, 8], [6, 8], [6, 9]], direction: 'RIGHT' },
      { path: [[5, 10], [6, 10], [6, 11]], direction: 'RIGHT' },
      { path: [[7, 3], [7, 2], [7, 1], [7, 0]], direction: 'LEFT' },
      { path: [[8, 5], [9, 5], [10, 5], [11, 5]], direction: 'DOWN' },
      { path: [[9, 8], [9, 9], [9, 10], [9, 11]], direction: 'RIGHT' },
    ],
  },
  {
    id: 'leaf',
    title: 'Leaf Lines',
    levelNumbers: [85, 185, 285, 385, 485],
    size: { rows: 13, cols: 13 },
    difficulty: 'Hard',
    arrows: [
      { path: [[12, 6], [11, 6], [10, 6], [9, 6]], direction: 'UP' },
      { path: [[8, 6], [7, 6], [6, 6]], direction: 'UP' },
      { path: [[5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6]], direction: 'UP' },
      { path: [[10, 4], [10, 3], [9, 3], [9, 2]], direction: 'LEFT' },
      { path: [[9, 8], [9, 9], [8, 9], [8, 10]], direction: 'RIGHT' },
      { path: [[7, 4], [7, 3], [6, 3], [6, 2], [6, 1], [6, 0]], direction: 'LEFT' },
      { path: [[6, 8], [6, 9], [5, 9], [5, 10], [5, 11], [5, 12]], direction: 'RIGHT' },
      { path: [[4, 4], [4, 3], [3, 3], [3, 2]], direction: 'LEFT' },
      { path: [[3, 8], [3, 9], [2, 9], [2, 10], [2, 11], [2, 12]], direction: 'RIGHT' },
      { path: [[11, 1], [12, 1]], direction: 'DOWN' },
    ],
  },
  {
    id: 'house',
    title: 'House Plan',
    levelNumbers: [110, 210, 310, 410],
    size: { rows: 12, cols: 12 },
    difficulty: 'Hard',
    arrows: [
      { path: [[4, 1], [3, 1], [3, 2], [2, 2], [2, 3], [1, 3], [1, 4], [0, 4]], direction: 'UP' },
      { path: [[4, 10], [3, 10], [3, 9], [2, 9], [2, 8], [1, 8], [1, 7], [0, 7]], direction: 'UP' },
      { path: [[5, 1], [6, 1], [7, 1], [8, 1]], direction: 'DOWN' },
      { path: [[5, 10], [6, 10], [7, 10], [8, 10]], direction: 'DOWN' },
      { path: [[8, 2], [8, 3], [9, 3]], direction: 'DOWN' },
      { path: [[8, 9], [8, 8], [9, 8]], direction: 'DOWN' },
      { path: [[9, 4], [10, 4], [11, 4]], direction: 'DOWN' },
      { path: [[9, 7], [10, 7], [11, 7]], direction: 'DOWN' },
      { path: [[5, 4], [5, 5], [5, 6], [5, 7]], direction: 'RIGHT' },
      { path: [[10, 1], [11, 1]], direction: 'DOWN' },
      { path: [[10, 10], [11, 10]], direction: 'DOWN' },
    ],
  },
  {
    id: 'bike',
    title: 'Bike Frame',
    levelNumbers: [150, 250, 350, 450],
    size: { rows: 13, cols: 13 },
    difficulty: 'Expert',
    arrows: [
      { path: [[8, 1], [8, 2], [8, 3], [8, 4]], direction: 'RIGHT' },
      { path: [[8, 8], [8, 9], [8, 10], [8, 11], [8, 12]], direction: 'RIGHT' },
      { path: [[7, 4], [6, 4], [6, 5], [5, 5]], direction: 'UP' },
      { path: [[7, 8], [6, 8], [6, 7], [5, 7]], direction: 'UP' },
      { path: [[8, 5], [8, 6], [8, 7]], direction: 'RIGHT' },
      { path: [[5, 4], [5, 3], [4, 3], [4, 2]], direction: 'LEFT' },
      { path: [[5, 8], [4, 8], [4, 9], [3, 9], [3, 10]], direction: 'RIGHT' },
      { path: [[3, 7], [2, 7], [2, 8], [2, 9]], direction: 'RIGHT' },
      { path: [[9, 2], [10, 2], [11, 2], [12, 2]], direction: 'DOWN' },
      { path: [[9, 10], [10, 10], [11, 10], [12, 10]], direction: 'DOWN' },
      { path: [[6, 1], [5, 1], [4, 1], [3, 1], [2, 1]], direction: 'UP' },
    ],
  },
  {
    id: 'screen',
    title: 'TV Frame',
    levelNumbers: [175, 275, 375, 475],
    size: { rows: 12, cols: 12 },
    difficulty: 'Hard',
    arrows: [
      { path: [[1, 1], [1, 2], [1, 3], [1, 4]], direction: 'RIGHT' },
      { path: [[1, 7], [1, 8], [1, 9], [1, 10], [1, 11]], direction: 'RIGHT' },
      { path: [[2, 0], [3, 0], [4, 0], [5, 0]], direction: 'DOWN' },
      { path: [[2, 11], [3, 11], [4, 11], [5, 11]], direction: 'DOWN' },
      { path: [[6, 1], [6, 2], [6, 3], [6, 4]], direction: 'RIGHT' },
      { path: [[6, 7], [6, 8], [6, 9], [6, 10], [6, 11]], direction: 'RIGHT' },
      { path: [[7, 5], [8, 5], [9, 5], [10, 5]], direction: 'DOWN' },
      { path: [[7, 6], [8, 6], [9, 6], [10, 6]], direction: 'DOWN' },
      { path: [[10, 3], [10, 2], [10, 1], [10, 0]], direction: 'LEFT' },
      { path: [[10, 8], [10, 9], [10, 10], [10, 11]], direction: 'RIGHT' },
    ],
  },
];

const solveOrder = (arrows: PuzzleArrow[], size: PuzzleLevel['size']) => {
  let current = arrows.map((arrow) => ({ ...arrow, path: arrow.path.map((point) => ({ ...point })) }));
  const order: string[] = [];
  let guard = 0;

  while (!isBoardComplete(current) && guard < 250) {
    const next = current.find((arrow) => arrow.state === 'normal' && canArrowEscape(current, size, arrow.id).canEscape);
    if (!next) return undefined;
    order.push(next.id);
    current = markArrowRemoved(current, next.id);
    guard += 1;
  }

  return isBoardComplete(current) ? order : undefined;
};

export const createThemedLevel = (levelNumber: number, seed: string): GeneratedLevel | undefined => {
  const template = templates.find((item) => item.levelNumbers.includes(levelNumber));
  if (!template) return undefined;

  const arrows = sanitizeTemplateArrows(template);
  const baseLevel: PuzzleLevel = {
    id: `theme-${template.id}-${levelNumber}`,
    title: template.title,
    size: template.size,
    difficulty: template.difficulty,
    arrows,
    solutionOrder: [],
  };
  if (!validateLevelGeometry(baseLevel)) return undefined;

  const solutionOrder = solveOrder(arrows, template.size);
  if (!solutionOrder) return undefined;
  const level = {
    ...baseLevel,
    solutionOrder,
    levelNumber,
    generationVersion: GENERATION_VERSION,
    seed,
    generationAttempts: 0,
    generationDurationMs: 0,
  };
  const metrics = analyzeDifficulty(level);
  return { ...level, metrics, difficultyScore: metrics.complexityScore };
};

export const isThemedLevelNumber = (levelNumber: number) => templates.some((template) => template.levelNumbers.includes(levelNumber));
