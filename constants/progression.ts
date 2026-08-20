import { Reward } from '../engine/types/game';

export const TOTAL_LEVELS = 500;
export const LEVELS_PER_CHAPTER = 50;
export const TOTAL_CHAPTERS = 10;

export const CHAPTERS = [
  'First Steps',
  'Crossroads',
  'Twisted Paths',
  'Locked Lines',
  'Deep Maze',
  'Chain Reaction',
  'Tangled Routes',
  'Mind Trap',
  'Arrow Master',
  'Nexa Core',
] as const;

export const XP_BY_DIFFICULTY = {
  Easy: 50,
  Normal: 75,
  Hard: 100,
  Expert: 150,
} as const;

export const RANK_REWARDS: Array<{ rank: number; rewards: Reward[] }> = [
  { rank: 2, rewards: [{ type: 'hint', amount: 1 }] },
  { rank: 5, rewards: [{ type: 'booster', booster: 'undo', amount: 1 }] },
  { rank: 10, rewards: [{ type: 'booster', booster: 'extra_life', amount: 1 }] },
  { rank: 15, rewards: [{ type: 'hint', amount: 2 }] },
  { rank: 20, rewards: [{ type: 'booster', booster: 'reveal', amount: 1 }] },
];

export const STAR_MILESTONE_REWARDS: Array<{ stars: number; rewards: Reward[] }> = [
  { stars: 25, rewards: [{ type: 'hint', amount: 1 }] },
  { stars: 50, rewards: [{ type: 'hint', amount: 2 }] },
  { stars: 100, rewards: [{ type: 'booster', booster: 'undo', amount: 1 }] },
  { stars: 200, rewards: [{ type: 'hint', amount: 3 }] },
  { stars: 300, rewards: [{ type: 'booster', booster: 'extra_life', amount: 1 }] },
  { stars: 500, rewards: [{ type: 'booster', booster: 'reveal', amount: 2 }] },
  { stars: 750, rewards: [{ type: 'hint', amount: 5 }] },
  { stars: 1000, rewards: [{ type: 'booster', booster: 'undo', amount: 2 }] },
  { stars: 1250, rewards: [{ type: 'booster', booster: 'extra_life', amount: 2 }] },
  { stars: 1500, rewards: [{ type: 'hint', amount: 10 }, { type: 'booster', booster: 'reveal', amount: 3 }] },
];

export const CHAPTER_REWARDS: Reward[] = [
  { type: 'hint', amount: 3 },
  { type: 'booster', booster: 'undo', amount: 1 },
];

export const DAILY_REWARD_SCHEDULE: Array<{ day: number; rewards: Reward[] }> = [
  { day: 1, rewards: [{ type: 'hint', amount: 1 }] },
  { day: 2, rewards: [{ type: 'hint', amount: 1 }] },
  { day: 3, rewards: [{ type: 'booster', booster: 'undo', amount: 1 }] },
  { day: 4, rewards: [{ type: 'hint', amount: 2 }] },
  { day: 5, rewards: [{ type: 'booster', booster: 'extra_life', amount: 1 }] },
  { day: 6, rewards: [{ type: 'booster', booster: 'reveal', amount: 1 }] },
  { day: 7, rewards: [{ type: 'hint', amount: 3 }, { type: 'booster', booster: 'undo', amount: 1 }] },
];

export const STREAK_MILESTONE_REWARDS: Array<{ streak: number; rewards: Reward[] }> = [
  { streak: 3, rewards: [{ type: 'hint', amount: 1 }] },
  { streak: 7, rewards: [{ type: 'booster', booster: 'reveal', amount: 1 }] },
  { streak: 14, rewards: [{ type: 'hint', amount: 2 }] },
  { streak: 30, rewards: [{ type: 'hint', amount: 5 }, { type: 'booster', booster: 'extra_life', amount: 1 }] },
];
