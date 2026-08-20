import { create } from 'zustand';
import { BoosterType, LevelPerformance, Reward } from '../../engine/types/game';
import { completeLevelProgression } from '../../services/progression/progressionService';
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
  claimDailyRewards: (rewards: Reward[], dailyState: ProgressData['dailyReward']) => Promise<boolean>;
};

const toInventoryKey = (booster: BoosterType): keyof ProgressData['boosterInventory'] => {
  if (booster === 'extra_life') return 'extraLife';
  if (booster === 'clear_blocker') return 'clearBlocker';
  return booster;
};

const snapshotProgress = (state: ProgressState): ProgressData => ({
  version: 3,
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
});

const persist = async (next: ProgressData, set: (state: Partial<ProgressState>) => void) => {
  set(next);
  await saveProgress(next);
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
        totalMistakes: current.stats.totalMistakes + performance.mistakes,
        threeStarLevels: current.stats.threeStarLevels + (previousStars < 3 && bestStars === 3 ? 1 : 0),
        totalXPEarned: current.stats.totalXPEarned + progression.xpGained,
        highestNexaRank: Math.max(current.stats.highestNexaRank, progression.rank),
        chapterFinalesCompleted: current.stats.chapterFinalesCompleted + (performance.levelNumber % 50 === 0 && !current.completedLevels[performance.levelNumber] ? 1 : 0),
        chaptersCompleted: current.stats.chaptersCompleted + (progression.chapterCompleted ? 1 : 0),
      },
      claimedRewards: { ...current.claimedRewards },
      achievements: updateProgressionAchievements(updateAchievements(current.achievements, performance), progression.rank, totalStars, progression.chapterCompleted),
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
    await persist(next, set);
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
      achievements: updateStreakAchievements(current.achievements, dailyState.currentStreak),
    };
    for (const reward of rewards) {
      if (reward.type === 'hint') next = { ...next, hints: next.hints + reward.amount };
      else {
        const key = toInventoryKey(reward.booster);
        next = { ...next, boosterInventory: { ...next.boosterInventory, [key]: next.boosterInventory[key] + reward.amount } };
      }
    }
    await persist(next, set);
    return true;
  },
}));

const updateAchievements = (achievements: ProgressData['achievements'], performance: LevelPerformance) => {
  const next = { ...achievements };
  const unlock = (id: string, amount = 1, target = 1) => {
    const current = next[id] ?? { progress: 0, unlocked: false };
    const progress = current.progress + amount;
    next[id] = { progress, unlocked: current.unlocked || progress >= target, unlockedAt: current.unlockedAt ?? (progress >= target ? new Date().toISOString() : undefined) };
  };
  if (performance.stars === 3) unlock('perfect_escape');
  if (performance.mistakes === 0) unlock('untouched', 1, 10);
  if (performance.difficulty === 'Hard' && performance.hintsUsed === 0) unlock('thinker');
  if (performance.livesRemaining === 1) unlock('survivor');
  if (performance.hintsUsed === 0) unlock('hint_saver', 1, 20);
  if (performance.usedExtraLife) unlock('comeback');
  return next;
};

const updateStreakAchievements = (achievements: ProgressData['achievements'], streak: number) => {
  const next = { ...achievements };
  const update = (id: string, target: number) => {
    const current = next[id] ?? { progress: 0, unlocked: false };
    const value = Math.max(current.progress, streak);
    next[id] = { progress: value, unlocked: current.unlocked || value >= target, unlockedAt: current.unlockedAt ?? (value >= target ? new Date().toISOString() : undefined) };
  };
  update('dedicated', 7);
  update('unstoppable', 30);
  return next;
};

const updateProgressionAchievements = (achievements: ProgressData['achievements'], rank: number, stars: number, chapterCompleted?: number) => {
  const next = { ...achievements };
  const unlock = (id: string, progress: number, target: number) => {
    const current = next[id] ?? { progress: 0, unlocked: false };
    const value = Math.max(current.progress, progress);
    next[id] = { progress: value, unlocked: current.unlocked || value >= target, unlockedAt: current.unlockedAt ?? (value >= target ? new Date().toISOString() : undefined) };
  };
  if (chapterCompleted === 1) unlock('chapter_one', 1, 1);
  unlock('star_collector', stars, 100);
  unlock('star_master', stars, 500);
  unlock('nexa_rising', rank, 10);
  unlock('nexa_master', rank, 25);
  return next;
};

export const persistProgressSnapshot = saveProgress;
