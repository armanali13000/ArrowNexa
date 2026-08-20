import { create } from 'zustand';
import { BoosterType, LevelPerformance, Reward } from '../../engine/types/game';
import { evaluateAchievements } from '../../services/progression/achievementService';
import { createDailySeed, getDailyDifficulty, getDailyReward, getChallengeStreakRewards, markChallengeMilestonesClaimed, mergeDailyResult, updateChallengeStreak } from '../../services/progression/dailyChallengeService';
import { getLocalDateKey, getWeekId } from '../../services/progression/dateService';
import { completeLevelProgression } from '../../services/progression/progressionService';
import { ensureWeeklyChallenge, getWeeklyReward, updateWeeklyFromDaily, updateWeeklyFromLevel } from '../../services/progression/weeklyChallengeService';
import { ProgressData, defaultProgress, loadProgress, resetProgressStorage, saveProgress } from '../../services/storage/progressStorage';

type ProgressState = ProgressData & {
  loaded: boolean;
  hydrate: () => Promise<void>;
  resetProgress: () => Promise<void>;
  updateProgress: (updater: (progress: ProgressData) => ProgressData) => Promise<void>;
  spendHint: () => Promise<boolean>;
  addHints: (amount: number) => Promise<void>;
  useBooster: (booster: BoosterType) => Promise<boolean>;
  addBooster: (booster: BoosterType, amount: number) => Promise<void>;
  applyReward: (reward: Reward) => Promise<void>;
  recordRetry: () => Promise<void>;
  recordLifeLost: () => Promise<void>;
  recordLevelCompletion: (performance: LevelPerformance, rewards: Reward[], rewardKeys: string[]) => Promise<void>;
  recordBlockedTap: () => Promise<void>;
  recordUndoUsed: () => Promise<void>;
  recordDailyChallengeStarted: (dateKey: string) => Promise<void>;
  recordDailyChallengeCompletion: (dateKey: string, performance: LevelPerformance) => Promise<{ rewardLabel: string; streak: number }>;
  claimDailyRewards: (rewards: Reward[], dailyState: ProgressData['dailyReward']) => Promise<boolean>;
  updateNotificationPreferences: (preferences: Partial<ProgressData['notificationPreferences']>) => Promise<void>;
};

const toInventoryKey = (booster: BoosterType): keyof ProgressData['boosterInventory'] => {
  if (booster === 'extra_life') return 'extraLife';
  if (booster === 'clear_blocker') return 'clearBlocker';
  return booster;
};

const snapshotProgress = (state: ProgressState): ProgressData => ({
  version: 4,
  currentLevel: state.currentLevel,
  highestUnlockedLevel: state.highestUnlockedLevel,
  completedLevels: state.completedLevels,
  levelRecords: state.levelRecords,
  xp: state.xp,
  nexaRank: state.nexaRank,
  highestNexaRank: state.highestNexaRank,
  completedChapters: state.completedChapters,
  hints: state.hints,
  boosterInventory: state.boosterInventory,
  streak: state.streak,
  bestStreak: state.bestStreak,
  totalArrowsCleared: state.totalArrowsCleared,
  hintsUsed: state.hintsUsed,
  totalPlayTimeSeconds: state.totalPlayTimeSeconds,
  stats: state.stats,
  achievements: state.achievements,
  claimedRewards: state.claimedRewards,
  mechanicTutorialsSeen: state.mechanicTutorialsSeen,
  dailyReward: state.dailyReward,
  dailyChallenges: state.dailyChallenges,
  challengeStreak: state.challengeStreak,
  weeklyChallenge: state.weeklyChallenge,
  personalRecords: state.personalRecords,
  activity: state.activity,
  unlockedAchievementQueue: state.unlockedAchievementQueue,
  notificationPreferences: state.notificationPreferences,
});

const persist = async (next: ProgressData, set: (state: Partial<ProgressState>) => void) => {
  set(next);
  await saveProgress(next);
};

const applyRewardToProgress = (progress: ProgressData, reward: Reward): ProgressData => {
  if (reward.type === 'hint') return { ...progress, hints: progress.hints + reward.amount };
  const key = toInventoryKey(reward.booster);
  return { ...progress, boosterInventory: { ...progress.boosterInventory, [key]: progress.boosterInventory[key] + reward.amount } };
};

const addActivity = (progress: ProgressData, dateKey: string, performance: LevelPerformance, dailyCompleted = false) => {
  const current = progress.activity[dateKey] ?? { date: dateKey, levelsCompleted: 0, starsEarned: 0, dailyCompleted: false, playTimeSeconds: 0 };
  return {
    ...progress.activity,
    [dateKey]: {
      ...current,
      levelsCompleted: current.levelsCompleted + (dailyCompleted ? 0 : 1),
      starsEarned: current.starsEarned + performance.stars,
      dailyCompleted: current.dailyCompleted || dailyCompleted,
      playTimeSeconds: current.playTimeSeconds + performance.timeSeconds,
    },
  };
};

const updatePersonalRecords = (progress: ProgressData, performance: LevelPerformance) => {
  const noHintStreak = performance.hintsUsed === 0 ? progress.personalRecords.currentNoHintStreak + 1 : 0;
  const perfectStreak = performance.stars === 3 ? progress.personalRecords.currentPerfectStreak + 1 : 0;
  const difficultyOrder = ['Easy', 'Normal', 'Hard', 'Expert'];
  const previousDifficulty = progress.personalRecords.highestDifficultyCompleted;
  const highestDifficultyCompleted = !previousDifficulty || difficultyOrder.indexOf(performance.difficulty) > difficultyOrder.indexOf(previousDifficulty)
    ? performance.difficulty
    : previousDifficulty;
  return {
    ...progress.personalRecords,
    fastestLevelSeconds: Math.min(progress.personalRecords.fastestLevelSeconds ?? Number.POSITIVE_INFINITY, performance.timeSeconds),
    currentNoHintStreak: noHintStreak,
    longestNoHintStreak: Math.max(progress.personalRecords.longestNoHintStreak, noHintStreak),
    currentPerfectStreak: perfectStreak,
    longestPerfectStreak: Math.max(progress.personalRecords.longestPerfectStreak, perfectStreak),
    mostStarsInSession: Math.max(progress.personalRecords.mostStarsInSession, performance.stars),
    highestDifficultyCompleted,
  };
};

const difficultyStatKey = (difficulty: LevelPerformance['difficulty']) => {
  if (difficulty === 'Easy') return 'easyCompleted';
  if (difficulty === 'Normal') return 'normalCompleted';
  if (difficulty === 'Hard') return 'hardCompleted';
  return 'expertCompleted';
};

export const useProgressStore = create<ProgressState>((set, get) => ({
  ...defaultProgress,
  loaded: false,
  hydrate: async () => {
    const progress = await loadProgress();
    set({ ...progress, loaded: true });
  },
  resetProgress: async () => {
    await resetProgressStorage();
    set({ ...defaultProgress, loaded: true });
  },
  updateProgress: async (updater) => {
    await persist(updater(snapshotProgress(get())), set);
  },
  spendHint: async () => {
    const current = snapshotProgress(get());
    if (current.hints <= 0) return false;
    await persist({ ...current, hints: current.hints - 1, hintsUsed: current.hintsUsed + 1 }, set);
    return true;
  },
  addHints: async (amount) => {
    const current = snapshotProgress(get());
    await persist({ ...current, hints: Math.max(0, current.hints + amount) }, set);
  },
  useBooster: async (booster) => {
    const current = snapshotProgress(get());
    const key = toInventoryKey(booster);
    if (current.boosterInventory[key] <= 0) return false;
    await persist({
      ...current,
      boosterInventory: { ...current.boosterInventory, [key]: current.boosterInventory[key] - 1 },
      stats: { ...current.stats, boostersUsed: current.stats.boostersUsed + 1 },
    }, set);
    return true;
  },
  addBooster: async (booster, amount) => {
    const current = snapshotProgress(get());
    const key = toInventoryKey(booster);
    await persist({ ...current, boosterInventory: { ...current.boosterInventory, [key]: Math.max(0, current.boosterInventory[key] + amount) } }, set);
  },
  applyReward: async (reward) => {
    if (reward.type === 'hint') await get().addHints(reward.amount);
    else await get().addBooster(reward.booster, reward.amount);
  },
  recordRetry: async () => {
    const current = snapshotProgress(get());
    await persist({ ...current, stats: { ...current.stats, retries: current.stats.retries + 1 } }, set);
  },
  recordLifeLost: async () => {
    const current = snapshotProgress(get());
    await persist({ ...current, stats: { ...current.stats, totalLivesLost: current.stats.totalLivesLost + 1 } }, set);
  },
  recordBlockedTap: async () => {
    const current = snapshotProgress(get());
    await persist({ ...current, stats: { ...current.stats, blockedTaps: current.stats.blockedTaps + 1 } }, set);
  },
  recordUndoUsed: async () => {
    const current = snapshotProgress(get());
    await persist({ ...current, stats: { ...current.stats, undoUsed: current.stats.undoUsed + 1 } }, set);
  },
  recordLevelCompletion: async (performance, rewards, rewardKeys) => {
    const current = snapshotProgress(get());
    const progression = completeLevelProgression(current, performance);
    const allRewards = [...rewards, ...progression.rewards];
    const allRewardKeys = [...rewardKeys, ...progression.rewardKeys];
    const previousStars = current.completedLevels[performance.levelNumber] ?? 0;
    const bestStars = Math.max(previousStars, performance.stars);
    const nextCompletedLevels = { ...current.completedLevels, [performance.levelNumber]: bestStars };
    const totalStars = Object.values(nextCompletedLevels).reduce((sum, stars) => sum + stars, 0);
    const previousRecord = current.levelRecords[performance.levelNumber];
    const nextRecord = {
      stars: bestStars,
      bestMistakes: previousRecord ? Math.min(previousRecord.bestMistakes, performance.mistakes) : performance.mistakes,
      bestHintsUsed: previousRecord ? Math.min(previousRecord.bestHintsUsed, performance.hintsUsed) : performance.hintsUsed,
      bestTimeSeconds: previousRecord?.bestTimeSeconds ? Math.min(previousRecord.bestTimeSeconds, performance.timeSeconds) : performance.timeSeconds,
      bestMoves: previousRecord?.bestMoves ? Math.min(previousRecord.bestMoves, performance.moves) : performance.moves,
    };
    let weeklyChallenge = updateWeeklyFromLevel(ensureWeeklyChallenge(current), performance);
    if (!weeklyChallenge.rewardClaimed && weeklyChallenge.objectives.every((objective) => objective.completed)) {
      rewards = [...rewards, ...getWeeklyReward()];
      weeklyChallenge = { ...weeklyChallenge, rewardClaimed: true };
    }
    let next: ProgressData = {
      ...current,
      currentLevel: Math.max(current.currentLevel, performance.levelNumber + 1),
      highestUnlockedLevel: Math.max(current.highestUnlockedLevel, performance.levelNumber + 1),
      xp: progression.xp,
      nexaRank: progression.rank,
      highestNexaRank: Math.max(current.highestNexaRank, progression.rank),
      completedChapters: progression.chapterCompleted && !current.completedChapters.includes(progression.chapterCompleted) ? [...current.completedChapters, progression.chapterCompleted] : current.completedChapters,
      completedLevels: nextCompletedLevels,
      levelRecords: { ...current.levelRecords, [performance.levelNumber]: nextRecord },
      totalArrowsCleared: current.totalArrowsCleared + performance.moves,
      totalPlayTimeSeconds: current.totalPlayTimeSeconds + performance.timeSeconds,
      stats: {
        ...current.stats,
        totalMoves: current.stats.totalMoves + performance.moves,
        successfulMoves: current.stats.successfulMoves + performance.moves,
        totalMistakes: current.stats.totalMistakes + performance.mistakes,
        threeStarLevels: current.stats.threeStarLevels + (previousStars < 3 && bestStars === 3 ? 1 : 0),
        totalXPEarned: current.stats.totalXPEarned + progression.xpGained,
        highestNexaRank: Math.max(current.stats.highestNexaRank, progression.rank),
        chapterFinalesCompleted: current.stats.chapterFinalesCompleted + (performance.levelNumber % 50 === 0 && !current.completedLevels[performance.levelNumber] ? 1 : 0),
        chaptersCompleted: current.stats.chaptersCompleted + (progression.chapterCompleted ? 1 : 0),
        [difficultyStatKey(performance.difficulty)]: current.stats[difficultyStatKey(performance.difficulty)] + (previousStars ? 0 : 1),
      },
      claimedRewards: { ...current.claimedRewards },
      weeklyChallenge,
      personalRecords: updatePersonalRecords(current, performance),
      activity: addActivity(current, getLocalDateKey(), performance),
    };
    for (const reward of allRewards) {
      if (reward.type === 'hint') {
        next = { ...next, hints: next.hints + reward.amount };
      } else {
        const key = toInventoryKey(reward.booster);
        next = { ...next, boosterInventory: { ...next.boosterInventory, [key]: next.boosterInventory[key] + reward.amount } };
      }
    }
    allRewardKeys.forEach((key) => {
      next.claimedRewards[key] = true;
    });
    const achievementResult = evaluateAchievements(next, performance);
    next = { ...next, achievements: achievementResult.achievements, unlockedAchievementQueue: [...next.unlockedAchievementQueue, ...achievementResult.unlockedIds] };
    achievementResult.rewards.forEach((reward) => {
      next = applyRewardToProgress(next, reward);
    });
    await persist(next, set);
  },
  recordDailyChallengeStarted: async (dateKey) => {
    const current = snapshotProgress(get());
    const existing = current.dailyChallenges[dateKey];
    if (existing) return;
    await persist({
      ...current,
      dailyChallenges: {
        ...current.dailyChallenges,
        [dateKey]: {
          date: dateKey,
          seed: createDailySeed(dateKey),
          generationVersion: 1,
          difficulty: getDailyDifficulty(dateKey),
          completed: false,
          perfect: false,
          bestStars: 0,
          rewardGranted: false,
          perfectRewardGranted: false,
        },
      },
    }, set);
  },
  recordDailyChallengeCompletion: async (dateKey, performance) => {
    const current = snapshotProgress(get());
    const previous = current.dailyChallenges[dateKey];
    const perfect = performance.mistakes === 0 && performance.hintsUsed === 0;
    const grantMainReward = !previous?.rewardGranted;
    const grantPerfectReward = perfect && !previous?.perfectRewardGranted;
    const dailyRewards = grantMainReward ? getDailyReward(performance.difficulty, grantPerfectReward) : grantPerfectReward ? [{ type: 'hint', amount: 1 } as Reward] : [];
    let challengeStreak = updateChallengeStreak(current.challengeStreak, dateKey);
    const streakRewards = getChallengeStreakRewards(challengeStreak);
    challengeStreak = markChallengeMilestonesClaimed(challengeStreak);
    let weeklyChallenge = updateWeeklyFromDaily(ensureWeeklyChallenge(current), performance);
    const weeklyRewards = !weeklyChallenge.rewardClaimed && weeklyChallenge.objectives.every((objective) => objective.completed) ? getWeeklyReward() : [];
    if (weeklyRewards.length) weeklyChallenge = { ...weeklyChallenge, rewardClaimed: true };
    const result = mergeDailyResult(previous, performance, dateKey, grantMainReward || grantPerfectReward);
    let next: ProgressData = {
      ...current,
      dailyChallenges: { ...current.dailyChallenges, [dateKey]: result },
      challengeStreak,
      weeklyChallenge,
      totalArrowsCleared: current.totalArrowsCleared + performance.moves,
      totalPlayTimeSeconds: current.totalPlayTimeSeconds + performance.timeSeconds,
      stats: {
        ...current.stats,
        successfulMoves: current.stats.successfulMoves + performance.moves,
        totalMoves: current.stats.totalMoves + performance.moves,
        totalMistakes: current.stats.totalMistakes + performance.mistakes,
        dailyChallengesCompleted: current.stats.dailyChallengesCompleted + (previous?.completed ? 0 : 1),
        perfectDailyChallenges: current.stats.perfectDailyChallenges + (!previous?.perfect && perfect ? 1 : 0),
      },
      personalRecords: updatePersonalRecords(current, performance),
      activity: addActivity(current, dateKey, performance, true),
    };
    [...dailyRewards, ...streakRewards, ...weeklyRewards].forEach((reward) => {
      next = applyRewardToProgress(next, reward);
    });
    const achievementResult = evaluateAchievements(next, performance);
    next = { ...next, achievements: achievementResult.achievements, unlockedAchievementQueue: [...next.unlockedAchievementQueue, ...achievementResult.unlockedIds] };
    achievementResult.rewards.forEach((reward) => {
      next = applyRewardToProgress(next, reward);
    });
    await persist(next, set);
    return {
      rewardLabel: [...dailyRewards, ...streakRewards, ...weeklyRewards].map((reward) => reward.type === 'hint' ? `+${reward.amount} Hint` : `+${reward.amount} Booster`).join(', ') || 'Personal best saved',
      streak: challengeStreak.current,
    };
  },
  claimDailyRewards: async (rewards, dailyState) => {
    const current = snapshotProgress(get());
    if (dailyState.lastClaimDate === current.dailyReward.lastClaimDate) return false;
    let next = {
      ...current,
      dailyReward: dailyState,
      streak: dailyState.currentStreak,
      bestStreak: Math.max(current.bestStreak, dailyState.bestStreak),
      stats: { ...current.stats, dailyRewardsClaimed: current.stats.dailyRewardsClaimed + 1 },
    };
    rewards.forEach((reward) => {
      next = applyRewardToProgress(next, reward);
    });
    const achievementResult = evaluateAchievements(next);
    next = { ...next, achievements: achievementResult.achievements, unlockedAchievementQueue: [...next.unlockedAchievementQueue, ...achievementResult.unlockedIds] };
    achievementResult.rewards.forEach((reward) => {
      next = applyRewardToProgress(next, reward);
    });
    await persist(next, set);
    return true;
  },
  updateNotificationPreferences: async (preferences) => {
    const current = snapshotProgress(get());
    await persist({ ...current, notificationPreferences: { ...current.notificationPreferences, ...preferences } }, set);
  },
}));

export const persistProgressSnapshot = saveProgress;
