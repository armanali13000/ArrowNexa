import AsyncStorage from '@react-native-async-storage/async-storage';
import { STARTING_BOOSTERS, STARTING_HINTS } from '../../constants/gameBalance';
import { Achievement, BoosterInventory, Difficulty, Reward } from '../../engine/types/game';
import { DailyRewardState, defaultDailyRewardState } from '../progression/dailyRewardService';
import { STORAGE_KEYS } from './keys';

export type LevelRecord = {
  stars: number;
  bestMistakes: number;
  bestHintsUsed: number;
  bestTimeSeconds: number;
  bestMoves: number;
};

export type ProgressStats = {
  totalMoves: number;
  totalMistakes: number;
  totalLivesLost: number;
  boostersUsed: number;
  retries: number;
  threeStarLevels: number;
  totalXPEarned: number;
  highestNexaRank: number;
  dailyRewardsClaimed: number;
  chapterFinalesCompleted: number;
  chaptersCompleted: number;
  undoUsed: number;
  blockedTaps: number;
  successfulMoves: number;
  dailyChallengesCompleted: number;
  perfectDailyChallenges: number;
  easyCompleted: number;
  normalCompleted: number;
  hardCompleted: number;
  expertCompleted: number;
};

export type DailyChallengeResult = {
  date: string;
  seed: string;
  generationVersion: number;
  difficulty: Difficulty;
  completed: boolean;
  perfect: boolean;
  bestStars: number;
  bestTimeSeconds?: number;
  bestMistakes?: number;
  bestHintsUsed?: number;
  bestMoves?: number;
  rewardGranted: boolean;
  perfectRewardGranted: boolean;
};

export type ChallengeStreakState = {
  current: number;
  best: number;
  lastCompletedDate?: string;
  claimedMilestones: Record<string, boolean>;
};

export type WeeklyObjectiveType = 'levels' | 'stars' | 'perfect_levels' | 'daily_challenges' | 'arrows_removed' | 'no_hint_levels';

export type WeeklyObjective = {
  id: string;
  type: WeeklyObjectiveType;
  title: string;
  target: number;
  progress: number;
  completed: boolean;
};

export type WeeklyChallengeState = {
  weekId: string;
  objectives: WeeklyObjective[];
  rewardClaimed: boolean;
};

export type PersonalRecords = {
  fastestLevelSeconds?: number;
  longestNoHintStreak: number;
  currentNoHintStreak: number;
  longestPerfectStreak: number;
  currentPerfectStreak: number;
  mostStarsInSession: number;
  highestDifficultyCompleted?: Difficulty;
};

export type ActivityDay = {
  date: string;
  levelsCompleted: number;
  starsEarned: number;
  dailyCompleted: boolean;
  playTimeSeconds: number;
};

export type NotificationPreferences = {
  enabled: boolean;
  dailyChallengeReminder: boolean;
  dailyRewardReminder: boolean;
  reminderHour: number;
};

export type ProgressData = {
  version: 4;
  currentLevel: number;
  highestUnlockedLevel: number;
  completedLevels: Record<number, number>;
  levelRecords: Record<number, LevelRecord>;
  xp: number;
  nexaRank: number;
  highestNexaRank: number;
  completedChapters: number[];
  hints: number;
  boosterInventory: BoosterInventory;
  streak: number;
  bestStreak: number;
  totalArrowsCleared: number;
  hintsUsed: number;
  totalPlayTimeSeconds: number;
  stats: ProgressStats;
  achievements: Record<string, Pick<Achievement, 'progress' | 'unlocked' | 'unlockedAt' | 'rewardGranted'>>;
  claimedRewards: Record<string, boolean>;
  mechanicTutorialsSeen: Record<string, boolean>;
  dailyReward: DailyRewardState;
  dailyChallenges: Record<string, DailyChallengeResult>;
  challengeStreak: ChallengeStreakState;
  weeklyChallenge: WeeklyChallengeState;
  personalRecords: PersonalRecords;
  activity: Record<string, ActivityDay>;
  unlockedAchievementQueue: string[];
  notificationPreferences: NotificationPreferences;
};

export const defaultProgress: ProgressData = {
  version: 4,
  currentLevel: 1,
  highestUnlockedLevel: 1,
  completedLevels: {},
  levelRecords: {},
  xp: 0,
  nexaRank: 1,
  highestNexaRank: 1,
  completedChapters: [],
  hints: STARTING_HINTS,
  boosterInventory: {
    extraLife: STARTING_BOOSTERS.extraLife,
    undo: STARTING_BOOSTERS.undo,
    reveal: STARTING_BOOSTERS.reveal,
    clearBlocker: STARTING_BOOSTERS.clearBlocker,
  },
  streak: 0,
  bestStreak: 0,
  totalArrowsCleared: 0,
  hintsUsed: 0,
  totalPlayTimeSeconds: 0,
  stats: {
    totalMoves: 0,
    totalMistakes: 0,
    totalLivesLost: 0,
    boostersUsed: 0,
    retries: 0,
    threeStarLevels: 0,
    totalXPEarned: 0,
    highestNexaRank: 1,
    dailyRewardsClaimed: 0,
    chapterFinalesCompleted: 0,
    chaptersCompleted: 0,
    undoUsed: 0,
    blockedTaps: 0,
    successfulMoves: 0,
    dailyChallengesCompleted: 0,
    perfectDailyChallenges: 0,
    easyCompleted: 0,
    normalCompleted: 0,
    hardCompleted: 0,
    expertCompleted: 0,
  },
  achievements: {},
  claimedRewards: {},
  mechanicTutorialsSeen: {},
  dailyReward: defaultDailyRewardState,
  dailyChallenges: {},
  challengeStreak: { current: 0, best: 0, claimedMilestones: {} },
  weeklyChallenge: { weekId: '', objectives: [], rewardClaimed: false },
  personalRecords: {
    longestNoHintStreak: 0,
    currentNoHintStreak: 0,
    longestPerfectStreak: 0,
    currentPerfectStreak: 0,
    mostStarsInSession: 0,
  },
  activity: {},
  unlockedAchievementQueue: [],
  notificationPreferences: {
    enabled: false,
    dailyChallengeReminder: false,
    dailyRewardReminder: false,
    reminderHour: 19,
  },
};

const createRecordsFromCompleted = (completedLevels: Record<number, number>) =>
  Object.fromEntries(
    Object.entries(completedLevels).map(([level, stars]) => [
      Number(level),
      {
        stars,
        bestMistakes: stars === 3 ? 0 : 99,
        bestHintsUsed: stars === 3 ? 0 : 99,
        bestTimeSeconds: 0,
        bestMoves: 0,
      },
    ]),
  ) as Record<number, LevelRecord>;

const migrateProgress = (rawProgress: Partial<ProgressData>): ProgressData => {
  const completedLevels = rawProgress.completedLevels ?? defaultProgress.completedLevels;
  const levelRecords = rawProgress.levelRecords ?? createRecordsFromCompleted(completedLevels);
  const stats = { ...defaultProgress.stats, ...rawProgress.stats };
  return {
    ...defaultProgress,
    ...rawProgress,
    version: 4,
    completedLevels,
    levelRecords,
    xp: rawProgress.xp ?? 0,
    nexaRank: rawProgress.nexaRank ?? 1,
    highestNexaRank: rawProgress.highestNexaRank ?? rawProgress.nexaRank ?? 1,
    completedChapters: rawProgress.completedChapters ?? [],
    hints: rawProgress.hints ?? STARTING_HINTS,
    boosterInventory: { ...defaultProgress.boosterInventory, ...rawProgress.boosterInventory },
    stats,
    achievements: rawProgress.achievements ?? {},
    claimedRewards: rawProgress.claimedRewards ?? {},
    mechanicTutorialsSeen: rawProgress.mechanicTutorialsSeen ?? {},
    dailyReward: { ...defaultDailyRewardState, ...rawProgress.dailyReward },
    dailyChallenges: rawProgress.dailyChallenges ?? {},
    challengeStreak: { ...defaultProgress.challengeStreak, ...rawProgress.challengeStreak, claimedMilestones: { ...rawProgress.challengeStreak?.claimedMilestones } },
    weeklyChallenge: { ...defaultProgress.weeklyChallenge, ...rawProgress.weeklyChallenge },
    personalRecords: { ...defaultProgress.personalRecords, ...rawProgress.personalRecords },
    activity: rawProgress.activity ?? {},
    unlockedAchievementQueue: rawProgress.unlockedAchievementQueue ?? [],
    notificationPreferences: { ...defaultProgress.notificationPreferences, ...rawProgress.notificationPreferences },
  };
};

export const loadProgress = async (): Promise<ProgressData> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.progress);
  if (!raw) return defaultProgress;
  return migrateProgress(JSON.parse(raw));
};

export const saveProgress = async (progress: ProgressData) => {
  await AsyncStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(progress));
};

export const resetProgressStorage = async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(defaultProgress));
};
