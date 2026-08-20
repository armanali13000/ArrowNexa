import { achievementCatalog } from '../../constants/achievements';
import { Achievement, LevelPerformance, Reward } from '../../engine/types/game';
import { ProgressData } from '../storage/progressStorage';
import { calculateTotalStars } from './progressionService';

export type AchievementEvaluationResult = {
  achievements: ProgressData['achievements'];
  rewards: Reward[];
  unlockedIds: string[];
};

const valueForAchievement = (achievement: Achievement, progress: ProgressData, performance?: LevelPerformance) => {
  const completedLevels = Object.keys(progress.completedLevels).length;
  const totalStars = calculateTotalStars(progress.completedLevels);
  const noHintLevels = Object.values(progress.levelRecords).filter((record) => record.bestHintsUsed === 0).length;
  const perfectLevels = Object.values(progress.completedLevels).filter((stars) => stars === 3).length;
  const dailyCompleted = Object.values(progress.dailyChallenges).filter((daily) => daily.completed).length;
  const perfectDaily = Object.values(progress.dailyChallenges).filter((daily) => daily.perfect).length;

  if (achievement.id === 'first_escape') return completedLevels;
  if (achievement.id === 'path_finder') return completedLevels;
  if (achievement.id === 'route_master') return completedLevels;
  if (achievement.id === 'nexa_veteran') return completedLevels;
  if (achievement.id === 'arrownexa_master') return completedLevels;
  if (achievement.id === 'flawless') return performance?.mistakes === 0 ? 1 : progress.achievements.flawless?.progress ?? 0;
  if (achievement.id === 'no_help_needed') return noHintLevels;
  if (achievement.id === 'untouchable') return performance?.difficulty === 'Hard' && performance.stars === 3 ? 1 : progress.achievements.untouchable?.progress ?? 0;
  if (achievement.id === 'expert_mind') return performance?.difficulty === 'Expert' && performance.hintsUsed === 0 ? 1 : progress.achievements.expert_mind?.progress ?? 0;
  if (achievement.id === 'perfect_run') return perfectLevels;
  if (achievement.id.startsWith('stars_')) return totalStars;
  if (achievement.id === 'daily_starter') return dailyCompleted;
  if (achievement.id === 'dedicated_solver') return dailyCompleted;
  if (achievement.id === 'daily_master') return dailyCompleted;
  if (achievement.id === 'perfect_day') return perfectDaily;
  if (achievement.id === 'seven_in_a_row') return progress.challengeStreak.best;
  if (achievement.id.startsWith('nexa_rank_')) return progress.nexaRank;
  if (achievement.id.startsWith('arrow_cleaner_')) return progress.totalArrowsCleared;
  if (achievement.id === 'hidden_comeback') return progress.achievements.hidden_comeback?.progress ?? 0;
  return progress.achievements[achievement.id]?.progress ?? achievement.progress;
};

export const evaluateAchievements = (progress: ProgressData, performance?: LevelPerformance): AchievementEvaluationResult => {
  const next = { ...progress.achievements };
  const rewards: Reward[] = [];
  const unlockedIds: string[] = [];
  const now = new Date().toISOString();

  achievementCatalog.forEach((achievement) => {
    const current = next[achievement.id] ?? { progress: 0, unlocked: false, rewardGranted: false };
    const value = Math.max(current.progress, Math.min(achievement.target, valueForAchievement(achievement, progress, performance)));
    const unlocked = current.unlocked || value >= achievement.target;
    const newlyUnlocked = unlocked && !current.unlocked;
    const rewardGranted = current.rewardGranted || Boolean(newlyUnlocked && achievement.reward);

    if (newlyUnlocked) {
      unlockedIds.push(achievement.id);
      if (achievement.reward) rewards.push(achievement.reward);
    }

    next[achievement.id] = {
      progress: value,
      unlocked,
      unlockedAt: current.unlockedAt ?? (unlocked ? now : undefined),
      rewardGranted,
    };
  });

  return { achievements: next, rewards, unlockedIds };
};
