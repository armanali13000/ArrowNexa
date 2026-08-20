import { PuzzleArrow, PuzzleLevel } from '../types/game';

const a = (id: string, path: Array<[number, number]>, direction: PuzzleArrow['direction'], order: number): PuzzleArrow => ({
  id,
  path: path.map(([row, col]) => ({ row, col })),
  direction,
  state: 'normal',
  order,
});

export const testLevelOne: PuzzleLevel = {
  id: 'test-1',
  title: 'Straight Starts',
  size: { rows: 8, cols: 8 },
  difficulty: 'Easy',
  solutionOrder: ['t1-a1', 't1-a2', 't1-a3', 't1-a4', 't1-a5', 't1-a6'],
  arrows: [
    a('t1-a1', [[1, 4], [1, 5], [1, 6], [1, 7]], 'RIGHT', 1),
    a('t1-a2', [[6, 3], [6, 2], [6, 1], [6, 0]], 'LEFT', 2),
    a('t1-a3', [[4, 1], [3, 1], [2, 1], [1, 1], [0, 1]], 'UP', 3),
    a('t1-a4', [[3, 6], [4, 6], [5, 6], [6, 6], [7, 6]], 'DOWN', 4),
    a('t1-a5', [[3, 3], [3, 2], [3, 1], [3, 0]], 'LEFT', 5),
    a('t1-a6', [[4, 4], [4, 5], [4, 6], [4, 7]], 'RIGHT', 6),
  ],
};

export const testLevelTwo: PuzzleLevel = {
  id: 'test-2',
  title: 'Corners First',
  size: { rows: 10, cols: 10 },
  difficulty: 'Normal',
  solutionOrder: ['t2-a1', 't2-a2', 't2-a3', 't2-a4', 't2-a5', 't2-a6', 't2-a7', 't2-a8'],
  arrows: [
    a('t2-a1', [[1, 1], [1, 2], [0, 2]], 'UP', 1),
    a('t2-a2', [[8, 8], [8, 7], [9, 7]], 'DOWN', 2),
    a('t2-a3', [[0, 4], [1, 4], [1, 5], [0, 5]], 'UP', 3),
    a('t2-a4', [[9, 5], [8, 5], [8, 4], [9, 4]], 'DOWN', 4),
    a('t2-a5', [[4, 2], [4, 1], [4, 0]], 'LEFT', 5),
    a('t2-a6', [[5, 7], [5, 8], [5, 9]], 'RIGHT', 6),
    a('t2-a7', [[3, 6], [3, 7], [2, 7], [2, 8], [2, 9]], 'RIGHT', 7),
    a('t2-a8', [[6, 3], [6, 2], [7, 2], [7, 1], [7, 0]], 'LEFT', 8),
  ],
};

const denseArrows: PuzzleArrow[] = [
  a('d-01', [[2, 0], [1, 0], [1, 1], [0, 1]], 'UP', 1),
  a('d-02', [[3, 2], [2, 2], [1, 2], [0, 2]], 'UP', 2),
  a('d-03', [[2, 4], [1, 4], [1, 5], [0, 5]], 'UP', 3),
  a('d-04', [[3, 6], [2, 6], [1, 6], [0, 6]], 'UP', 4),
  a('d-05', [[2, 8], [1, 8], [1, 9], [0, 9]], 'UP', 5),
  a('d-06', [[3, 10], [2, 10], [1, 10], [0, 10]], 'UP', 6),
  a('d-07', [[1, 9], [1, 10], [2, 10], [2, 11]], 'RIGHT', 7),
  a('d-08', [[3, 8], [3, 9], [4, 9], [4, 10], [4, 11]], 'RIGHT', 8),
  a('d-09', [[5, 7], [5, 8], [5, 9], [5, 10], [5, 11]], 'RIGHT', 9),
  a('d-10', [[6, 8], [6, 9], [7, 9], [7, 10], [7, 11]], 'RIGHT', 10),
  a('d-11', [[8, 7], [8, 8], [9, 8], [9, 9], [9, 10], [9, 11]], 'RIGHT', 11),
  a('d-12', [[10, 8], [10, 9], [10, 10], [10, 11]], 'RIGHT', 12),
  a('d-13', [[8, 1], [9, 1], [10, 1], [11, 1]], 'DOWN', 13),
  a('d-14', [[7, 2], [8, 2], [9, 2], [10, 2], [11, 2]], 'DOWN', 14),
  a('d-15', [[8, 4], [9, 4], [10, 4], [11, 4]], 'DOWN', 15),
  a('d-16', [[7, 5], [8, 5], [9, 5], [10, 5], [11, 5]], 'DOWN', 16),
  a('d-17', [[8, 7], [9, 7], [10, 7], [11, 7]], 'DOWN', 17),
  a('d-18', [[7, 8], [8, 8], [9, 8], [10, 8], [11, 8]], 'DOWN', 18),
  a('d-19', [[8, 10], [9, 10], [10, 10], [11, 10]], 'DOWN', 19),
  a('d-20', [[10, 3], [10, 2], [10, 1], [10, 0]], 'LEFT', 20),
  a('d-21', [[8, 4], [8, 3], [7, 3], [7, 2], [7, 1], [7, 0]], 'LEFT', 21),
  a('d-22', [[6, 4], [6, 3], [6, 2], [6, 1], [6, 0]], 'LEFT', 22),
  a('d-23', [[5, 5], [5, 4], [4, 4], [4, 3], [4, 2], [4, 1], [4, 0]], 'LEFT', 23),
  a('d-24', [[3, 4], [3, 3], [2, 3], [2, 2], [2, 1], [2, 0]], 'LEFT', 24),
  a('d-25', [[1, 4], [1, 3], [1, 2], [1, 1], [1, 0]], 'LEFT', 25),
  a('d-26', [[9, 6], [8, 6], [7, 6], [6, 6], [6, 7], [6, 8], [6, 9], [6, 10], [6, 11]], 'RIGHT', 26),
  a('d-27', [[9, 4], [9, 5], [9, 6], [9, 7]], 'RIGHT', 27),
];

export const testLevelThree: PuzzleLevel = {
  id: 'test-3',
  title: 'Dense Practice',
  size: { rows: 12, cols: 12 },
  difficulty: 'Hard',
  solutionOrder: denseArrows.map((arrow) => arrow.id),
  arrows: denseArrows,
};

export const denseReferenceLevel: PuzzleLevel = {
  id: 'test-4',
  title: 'Tangled Routes',
  size: { rows: 12, cols: 12 },
  difficulty: 'Hard',
  solutionOrder: denseArrows.map((arrow) => arrow.id.replace('d-', 'r-')),
  arrows: denseArrows.map((arrow) => ({ ...arrow, id: arrow.id.replace('d-', 'r-') })),
};

export const testLevelFive: PuzzleLevel = {
  id: 'test-5',
  title: 'Multi-Turn Paths',
  size: { rows: 10, cols: 10 },
  difficulty: 'Expert',
  solutionOrder: ['m-01', 'm-02', 'm-03', 'm-04', 'm-05', 'm-06', 'm-07'],
  arrows: [
    a('m-01', [[2, 0], [1, 0], [1, 1], [0, 1]], 'UP', 1),
    a('m-02', [[2, 9], [1, 9], [1, 8], [0, 8]], 'UP', 2),
    a('m-03', [[7, 0], [8, 0], [8, 1], [9, 1]], 'DOWN', 3),
    a('m-04', [[7, 9], [8, 9], [8, 8], [9, 8]], 'DOWN', 4),
    a('m-05', [[4, 1], [4, 2], [5, 2], [5, 1], [5, 0]], 'LEFT', 5),
    a('m-06', [[2, 5], [3, 5], [3, 6], [3, 7], [3, 8], [3, 9]], 'RIGHT', 6),
    a('m-07', [[7, 5], [6, 5], [6, 6], [6, 7], [6, 8], [6, 9]], 'RIGHT', 7),
  ],
};

export const phaseTwoTestLevels = [testLevelOne, testLevelTwo, testLevelThree, denseReferenceLevel, testLevelFive];
