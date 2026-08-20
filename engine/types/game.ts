export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type ArrowState = 'normal' | 'selected' | 'blocked' | 'hinted' | 'moving' | 'restoring' | 'removed';
export type Difficulty = 'Easy' | 'Normal' | 'Hard' | 'Expert';
export type LevelState = 'locked' | 'unlocked' | 'completed' | 'perfect';
export type PuzzleStatus = 'playing' | 'paused' | 'completed' | 'failed';
export type BoosterType = 'extra_life' | 'undo' | 'reveal' | 'clear_blocker';
export type AchievementCategory = 'Progression' | 'Skill' | 'Daily' | 'Stars' | 'Streak' | 'Exploration' | 'Mastery';
export type AchievementTier = 'Bronze' | 'Silver' | 'Gold' | 'Master';

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

export type LevelGenerationConfig = {
  rows: number;
  cols: number;
  targetArrowCount: number;
  minPathLength: number;
  maxPathLength: number;
  maxTurnsPerArrow: number;
  targetDensity: { min: number; max: number };
  difficulty: Difficulty;
  targetScore: number;
  branchingTarget?: number;
  minimumSolutionDepth?: number;
  maximumSolutionDepth?: number;
  seed: string;
};

export type DifficultyMetrics = {
  arrowCount: number;
  occupiedCells: number;
  density: number;
  solutionDepth: number;
  initialValidMoves: number;
  averageValidMoves: number;
  dependencyDepth: number;
  branchingScore: number;
  forcedMoveRatio: number;
  averagePathLength: number;
  averageTurns: number;
  complexityScore: number;
};

export type SolverResult = {
  solvable: boolean;
  solution?: string[];
  exploredStates: number;
  solutionLength?: number;
  branchingScore?: number;
  maxDepth?: number;
  averageValidMoves?: number;
  forcedMoveRatio?: number;
};

export type GeneratedLevel = PuzzleLevel & {
  levelNumber: number;
  generationVersion: number;
  seed: string;
  difficultyScore: number;
  metrics: DifficultyMetrics;
  generationAttempts: number;
  generationDurationMs: number;
};

export type BoosterInventory = {
  extraLife: number;
  undo: number;
  reveal: number;
  clearBlocker: number;
};

export type Reward =
  | { type: 'hint'; amount: number }
  | { type: 'booster'; booster: BoosterType; amount: number };

export type LevelPerformance = {
  levelNumber: number;
  completed: boolean;
  stars: number;
  moves: number;
  mistakes: number;
  hintsUsed: number;
  livesRemaining: number;
  timeSeconds: number;
  difficulty: Difficulty;
  usedExtraLife: boolean;
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
  category?: AchievementCategory;
  tier?: AchievementTier;
  hidden?: boolean;
  reward?: Reward & { xp?: number };
  progress: number;
  target: number;
  unlocked: boolean;
  unlockedAt?: string;
  rewardGranted?: boolean;
};
