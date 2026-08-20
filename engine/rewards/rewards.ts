import { MILESTONE_REWARDS } from '../../constants/gameBalance';
import { LevelPerformance, Reward } from '../types/game';

export type RewardResult = {
  rewards: Reward[];
  rewardKeys: string[];
  label: string;
};

export const calculateCompletionRewards = (performance: LevelPerformance, claimedRewards: Record<string, boolean>): RewardResult => {
  const rewards: Reward[] = [];
  const rewardKeys: string[] = [];
  const addReward = (key: string, reward: Reward) => {
    if (claimedRewards[key]) return;
    rewards.push(reward);
    rewardKeys.push(key);
  };

  if (performance.levelNumber % 5 === 0) {
    addReward(`repeat:hint:${performance.levelNumber}`, { type: 'hint', amount: 1 });
  }

  if (performance.stars === 3) {
    addReward(`perfect:${performance.levelNumber}`, { type: 'hint', amount: 1 });
  }

  MILESTONE_REWARDS.forEach((milestone) => {
    const key = `milestone:${milestone.level}`;
    if (performance.levelNumber >= milestone.level && !claimedRewards[key]) {
      rewards.push(...milestone.rewards);
      rewardKeys.push(key);
    }
  });

  return {
    rewards,
    rewardKeys,
    label: rewards.length ? rewards.map(formatReward).join(', ') : 'Progress unlocked',
  };
};

const formatReward = (reward: Reward) => {
  if (reward.type === 'hint') return `+${reward.amount} Hint${reward.amount === 1 ? '' : 's'}`;
  const name = reward.booster === 'extra_life' ? 'Extra Life' : reward.booster === 'clear_blocker' ? 'Clear Blocker' : reward.booster[0].toUpperCase() + reward.booster.slice(1);
  return `+${reward.amount} ${name}`;
};
