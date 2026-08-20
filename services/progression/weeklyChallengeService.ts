import { LevelPerformance, Reward } from '../../engine/types/game';
import { ProgressData, WeeklyChallengeState, WeeklyObjective, WeeklyObjectiveType } from '../storage/progressStorage';
import { getWeekId } from './dateService';

const objectivePool: Array<Omit<WeeklyObjective, 'progress' | 'completed'>> = [
  { id: 'levels', type: 'levels', title: 'Complete Levels', target: 10 },
  { id: 'stars', type: 'stars', title: 'Earn Stars', target: 20 },
  { id: 'perfect_levels', type: 'perfect_levels', title: 'Perfect Clears', target: 3 },
  { id: 'daily_challenges', type: 'daily_challenges', title: 'Daily Challenges', target: 5 },
  { id: 'arrows_removed', type: 'arrows_removed', title: 'Clear Arrows', target: 500 },
  { id: 'no_hint_levels', type: 'no_hint_levels', title: 'No-Hint Levels', target: 3 },
];

export const createWeeklyChallenge = (weekId = getWeekId(), playerLevel = 1): WeeklyChallengeState => {
  const offset = weekId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % objectivePool.length;
  const selected = [0, 2, 4].map((step) => objectivePool[(offset + step) % objectivePool.length]);
  const scale = playerLevel < 15 ? 0.65 : playerLevel < 50 ? 0.85 : 1;
  return {
    weekId,
    rewardClaimed: false,
    objectives: selected.map((objective) => ({
      ...objective,
      target: Math.max(1, Math.round(objective.target * scale)),
      progress: 0,
      completed: false,
    })),
  };
};

const addProgress = (objective: WeeklyObjective, amount: number) => {
  const progress = Math.min(objective.target, objective.progress + amount);
  return { ...objective, progress, completed: progress >= objective.target };
};

export const ensureWeeklyChallenge = (progress: ProgressData, weekId = getWeekId()) =>
  progress.weeklyChallenge.weekId === weekId && progress.weeklyChallenge.objectives.length
    ? progress.weeklyChallenge
    : createWeeklyChallenge(weekId, progress.currentLevel);

export const updateWeeklyFromLevel = (weekly: WeeklyChallengeState, performance: LevelPerformance) => ({
  ...weekly,
  objectives: weekly.objectives.map((objective) => {
    const amountByType: Record<WeeklyObjectiveType, number> = {
      levels: 1,
      stars: performance.stars,
      perfect_levels: performance.stars === 3 ? 1 : 0,
      daily_challenges: 0,
      arrows_removed: performance.moves,
      no_hint_levels: performance.hintsUsed === 0 ? 1 : 0,
    };
    return addProgress(objective, amountByType[objective.type]);
  }),
});

export const updateWeeklyFromDaily = (weekly: WeeklyChallengeState, performance: LevelPerformance) => ({
  ...weekly,
  objectives: weekly.objectives.map((objective) => {
    const amountByType: Record<WeeklyObjectiveType, number> = {
      levels: 0,
      stars: performance.stars,
      perfect_levels: performance.stars === 3 ? 1 : 0,
      daily_challenges: 1,
      arrows_removed: performance.moves,
      no_hint_levels: performance.hintsUsed === 0 ? 1 : 0,
    };
    return addProgress(objective, amountByType[objective.type]);
  }),
});

export const getWeeklyReward = (): Reward[] => [{ type: 'hint', amount: 2 }, { type: 'booster', booster: 'undo', amount: 1 }];
