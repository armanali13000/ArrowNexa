import { CHAPTER_REWARDS, STAR_MILESTONE_REWARDS } from '../../constants/progression';
import { LevelPerformance, Reward } from '../../engine/types/game';
import { ProgressData } from '../storage/progressStorage';
import { getChapterForLevel } from './chapterService';
import { applyXP, calculateLevelXP } from './xpService';

export type ProgressionResult = {
  xpGained: number;
  rank: number;
  xp: number;
  rankUps: Array<{ rank: number; rewards: Reward[] }>;
  rewards: Reward[];
  rewardKeys: string[];
  chapterCompleted?: number;
};

export const calculateTotalStars = (completedLevels: Record<number, number>) => Object.values(completedLevels).reduce((sum, stars) => sum + stars, 0);

export const getRecommendedLevel = (progress: Pick<ProgressData, 'highestUnlockedLevel' | 'completedLevels'>) => {
  for (let level = 1; level <= progress.highestUnlockedLevel; level += 1) {
    if (!progress.completedLevels[level]) return level;
  }
  return Math.min(500, progress.highestUnlockedLevel);
};

export const completeLevelProgression = (progress: ProgressData, performance: LevelPerformance): ProgressionResult => {
  const firstCompletion = !progress.completedLevels[performance.levelNumber];
  const xpGained = calculateLevelXP(performance.difficulty, performance.stars, firstCompletion);
  const xpResult = applyXP(progress.xp, progress.nexaRank, xpGained);
  const rewards: Reward[] = [];
  const rewardKeys: string[] = [];

  const nextCompleted = { ...progress.completedLevels, [performance.levelNumber]: Math.max(progress.completedLevels[performance.levelNumber] ?? 0, performance.stars) };
  const totalStars = calculateTotalStars(nextCompleted);
  STAR_MILESTONE_REWARDS.forEach((milestone) => {
    const key = `star:${milestone.stars}`;
    if (totalStars >= milestone.stars && !progress.claimedRewards[key]) {
      rewards.push(...milestone.rewards);
      rewardKeys.push(key);
    }
  });

  xpResult.rankUps.forEach((rankUp) => {
    if (rankUp.rewards.length) {
      rewards.push(...rankUp.rewards);
      rewardKeys.push(`rank:${rankUp.rank}`);
    }
  });

  const chapter = getChapterForLevel(performance.levelNumber);
  const chapterLevelsComplete = Array.from({ length: chapter.endLevel - chapter.startLevel + 1 }, (_, index) => chapter.startLevel + index).every((level) => nextCompleted[level]);
  const chapterKey = `chapter:${chapter.chapter}`;
  let chapterCompleted: number | undefined;
  if (chapterLevelsComplete && !progress.claimedRewards[chapterKey]) {
    rewards.push(...CHAPTER_REWARDS);
    rewardKeys.push(chapterKey);
    chapterCompleted = chapter.chapter;
  }

  return { xpGained, rank: xpResult.rank, xp: xpResult.xp, rankUps: xpResult.rankUps, rewards, rewardKeys, chapterCompleted };
};
