import { PuzzleArrow, PuzzleLevel } from '../types/game';

const arrow = (id: string, path: Array<[number, number]>, direction: PuzzleArrow['direction'], order: number): PuzzleArrow => ({
  id,
  path: path.map(([row, col]) => ({ row, col })),
  direction,
  state: 'normal',
  order,
});

export const diagnosticBoard: PuzzleLevel = {
  id: 'diagnostic-board',
  title: 'Gameplay Diagnostics',
  size: { rows: 12, cols: 12 },
  difficulty: 'Hard',
  solutionOrder: [],
  arrows: [
    arrow('sample-right', [[1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9], [1, 10], [1, 11]], 'RIGHT', 1),
    arrow('sample-left', [[10, 9], [10, 8], [10, 7], [10, 6], [10, 5], [10, 4], [10, 3], [10, 2], [10, 1], [10, 0]], 'LEFT', 2),
    arrow('sample-up', [[8, 2], [7, 2], [6, 2], [5, 2], [4, 2], [3, 2], [2, 2], [1, 2], [0, 2]], 'UP', 3),
    arrow('sample-down', [[3, 9], [4, 9], [5, 9], [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9]], 'DOWN', 4),
    arrow('sample-l-1', [[3, 0], [3, 1], [2, 1], [2, 2], [1, 2], [0, 2]], 'UP', 5),
    arrow('sample-l-2', [[0, 5], [1, 5], [1, 6], [2, 6], [2, 7], [2, 8], [2, 9], [2, 10], [2, 11]], 'RIGHT', 6),
    arrow('sample-two-1', [[4, 0], [4, 1], [5, 1], [5, 2], [6, 2], [6, 3], [6, 4], [6, 5], [6, 6], [6, 7], [6, 8], [6, 9], [6, 10], [6, 11]], 'RIGHT', 7),
    arrow('sample-two-2', [[11, 4], [10, 4], [10, 5], [9, 5], [9, 6], [8, 6], [8, 7], [7, 7], [7, 8], [7, 9], [7, 10], [7, 11]], 'RIGHT', 8),
    arrow('sample-three', [[11, 7], [10, 7], [10, 8], [9, 8], [9, 9], [8, 9], [8, 10], [8, 11]], 'RIGHT', 9),
    arrow('sample-u', [[11, 1], [10, 1], [9, 1], [9, 2], [9, 3], [8, 3], [7, 3], [7, 4], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5]], 'DOWN', 10),
    arrow('sample-short-1', [[0, 0], [1, 0]], 'UP', 11),
    arrow('sample-short-2', [[0, 11], [1, 11]], 'UP', 12),
    arrow('sample-short-3', [[11, 0], [10, 0]], 'DOWN', 13),
    arrow('sample-short-4', [[11, 11], [10, 11]], 'DOWN', 14),
    arrow('sample-short-5', [[5, 0], [5, 1]], 'LEFT', 15),
    arrow('sample-short-6', [[6, 0], [6, 1]], 'LEFT', 16),
    arrow('sample-short-7', [[5, 11], [5, 10]], 'RIGHT', 17),
    arrow('sample-short-8', [[4, 11], [4, 10]], 'RIGHT', 18),
    arrow('sample-z-1', [[2, 0], [2, 1], [3, 1], [3, 2], [3, 3], [4, 3], [4, 4], [4, 5]], 'RIGHT', 19),
    arrow('sample-z-2', [[7, 0], [7, 1], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5]], 'RIGHT', 20),
    arrow('sample-z-3', [[0, 7], [1, 7], [1, 8], [2, 8], [3, 8]], 'UP', 21),
    arrow('sample-z-4', [[11, 8], [10, 8], [10, 9], [9, 9]], 'DOWN', 22),
    arrow('sample-l-3', [[0, 3], [1, 3], [1, 4]], 'UP', 23),
    arrow('sample-l-4', [[11, 3], [10, 3], [10, 2]], 'DOWN', 24),
    arrow('sample-l-5', [[3, 11], [3, 10], [4, 10]], 'RIGHT', 25),
    arrow('sample-l-6', [[8, 0], [8, 1], [7, 1]], 'LEFT', 26),
    arrow('sample-line-1', [[0, 6], [1, 6]], 'UP', 27),
    arrow('sample-line-2', [[11, 6], [10, 6]], 'DOWN', 28),
    arrow('sample-line-3', [[9, 11], [9, 10]], 'RIGHT', 29),
    arrow('sample-line-4', [[2, 11], [2, 10]], 'RIGHT', 30),
  ],
};

diagnosticBoard.solutionOrder = diagnosticBoard.arrows.map((item) => item.id);
