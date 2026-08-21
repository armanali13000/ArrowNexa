import { Difficulty } from '../engine/types/game';

export const DEFAULT_LIVES = 3;
export const MAX_LIVES_WITH_BOOSTER = 4;
export const FREE_UNDOS_PER_LEVEL = 1;
export const STARTING_HINTS = 5;

export const STARTING_BOOSTERS = {
  extraLife: 2,
  undo: 2,
  reveal: 2,
  clearBlocker: 0,
} as const;

export const FIRST_LIFE_LOSS_LEVEL = 1;
export const REVEAL_COUNT = 3;

export const STAR_RULES = {
  three: { maxMistakes: 0, maxHintsUsed: 0 },
  two: { maxMistakes: 2, maxHintsUsed: 1 },
} as const;

export const MILESTONE_REWARDS = [
  { level: 10, rewards: [{ type: 'hint', amount: 2 }] },
  { level: 25, rewards: [{ type: 'booster', booster: 'undo', amount: 1 }] },
  { level: 50, rewards: [{ type: 'hint', amount: 2 }, { type: 'booster', booster: 'extra_life', amount: 1 }] },
  { level: 100, rewards: [{ type: 'hint', amount: 5 }, { type: 'booster', booster: 'reveal', amount: 2 }] },
] as const;

export const difficultyStarLabel: Record<Difficulty, string> = {
  Easy: 'Easy',
  Normal: 'Normal',
  Hard: 'Hard',
  Expert: 'Expert',
};
