import { DAILY_REWARD_SCHEDULE, STREAK_MILESTONE_REWARDS } from '../../constants/progression';
import { Reward } from '../../engine/types/game';

export type DailyRewardState = {
  lastClaimDate: string | null;
  cycleDay: number;
  currentStreak: number;
  bestStreak: number;
  claimedStreakMilestones: string[];
  lastKnownDate: string | null;
};

export const defaultDailyRewardState: DailyRewardState = {
  lastClaimDate: null,
  cycleDay: 1,
  currentStreak: 0,
  bestStreak: 0,
  claimedStreakMilestones: [],
  lastKnownDate: null,
};

export const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const dayDiff = (left: string, right: string) => Math.round((Date.parse(`${right}T00:00:00`) - Date.parse(`${left}T00:00:00`)) / 86400000);

export const getDailyClaimStatus = (state: DailyRewardState, today = getLocalDateKey()) => {
  if (state.lastKnownDate && today < state.lastKnownDate) return { available: false, rollback: true };
  return { available: state.lastClaimDate !== today, rollback: false };
};

export const claimDailyReward = (state: DailyRewardState, today = getLocalDateKey()) => {
  const status = getDailyClaimStatus(state, today);
  if (!status.available) return { claimed: false, state: { ...state, lastKnownDate: maxDate(state.lastKnownDate, today) }, rewards: [] as Reward[], streakRewards: [] as Reward[] };

  const consecutive = state.lastClaimDate ? dayDiff(state.lastClaimDate, today) === 1 : false;
  const currentStreak = consecutive ? state.currentStreak + 1 : 1;
  const rewardDay = state.cycleDay;
  const cycleDay = (state.cycleDay % 7) + 1;
  const rewards = DAILY_REWARD_SCHEDULE.find((entry) => entry.day === rewardDay)?.rewards ?? [];
  const claimedStreakMilestones = [...state.claimedStreakMilestones];
  const streakRewards: Reward[] = [];
  STREAK_MILESTONE_REWARDS.forEach((milestone) => {
    const key = `streak:${milestone.streak}:${currentStreak}`;
    if (currentStreak >= milestone.streak && !claimedStreakMilestones.includes(key)) {
      streakRewards.push(...milestone.rewards);
      claimedStreakMilestones.push(key);
    }
  });
  return {
    claimed: true,
    rewards,
    streakRewards,
    state: {
      lastClaimDate: today,
      cycleDay,
      currentStreak,
      bestStreak: Math.max(state.bestStreak, currentStreak),
      claimedStreakMilestones,
      lastKnownDate: maxDate(state.lastKnownDate, today),
    },
  };
};

const maxDate = (left: string | null, right: string) => (!left || right > left ? right : left);
