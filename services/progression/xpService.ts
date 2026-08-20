import { RANK_REWARDS, XP_BY_DIFFICULTY } from '../../constants/progression';
import { Difficulty, Reward } from '../../engine/types/game';

export const xpRequiredForRank = (rank: number) => Math.floor(220 + Math.pow(Math.max(1, rank - 1), 1.42) * 95);

export const calculateLevelXP = (difficulty: Difficulty, stars: number, isFirstCompletion: boolean) => {
  if (!isFirstCompletion) return 0;
  const base = XP_BY_DIFFICULTY[difficulty];
  const multiplier = stars === 3 ? 1.25 : stars === 2 ? 1.1 : 1;
  return Math.round(base * multiplier);
};

export const applyXP = (currentXP: number, currentRank: number, gainedXP: number) => {
  let xp = currentXP + gainedXP;
  let rank = currentRank;
  const rankUps: Array<{ rank: number; rewards: Reward[] }> = [];
  while (xp >= xpRequiredForRank(rank)) {
    xp -= xpRequiredForRank(rank);
    rank += 1;
    rankUps.push({ rank, rewards: RANK_REWARDS.find((entry) => entry.rank === rank)?.rewards ?? [] });
  }
  return { xp, rank, rankUps, xpToNext: xpRequiredForRank(rank) };
};
