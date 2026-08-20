export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type ArrowState = 'normal' | 'selected' | 'blocked' | 'hinted' | 'moving' | 'removed';
export type Difficulty = 'Easy' | 'Normal' | 'Hard' | 'Expert';
export type LevelState = 'locked' | 'unlocked' | 'completed' | 'perfect';
export type PuzzleStatus = 'playing' | 'paused' | 'completed' | 'failed';

export type GridPoint = {
  row: number;
  col: number;
};

export type PuzzleArrow = {
  id: string;
  path: GridPoint[];
  direction: Direction;
  state: ArrowState;
  order?: number;
};

export type PuzzleLevel = {
  id: string;
  title: string;
  size: { rows: number; cols: number };
  difficulty: Difficulty;
  arrows: PuzzleArrow[];
  solutionOrder: string[];
};

export type PuzzleState = {
  levelId: string;
  arrows: PuzzleArrow[];
  status: PuzzleStatus;
  moveCount: number;
  selectedArrowId?: string;
  hintedArrowId?: string;
};

export type EscapeCheck = {
  canEscape: boolean;
  blockerId?: string;
  checkedCells: GridPoint[];
};

export type ArrowPieceData = PuzzleArrow;
export type DemoBoard = PuzzleLevel;

export type LevelSummary = {
  level: number;
  difficulty: Difficulty;
  state: LevelState;
  stars: number;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  unlocked: boolean;
  unlockedAt?: string;
};
