import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const outDir = join(tmpdir(), 'arrownexa-phase8-tests');
const tscBin = join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc');

rmSync(outDir, { recursive: true, force: true });
execFileSync(process.execPath, [
  tscBin,
  '--ignoreConfig',
  '--ignoreDeprecations',
  '6.0',
  '--module',
  'CommonJS',
  '--moduleResolution',
  'Node',
  '--target',
  'ES2022',
  '--outDir',
  outDir,
  '--rootDir',
  '.',
  'services/progression/dailyChallengeService.ts',
  'services/progression/weeklyChallengeService.ts',
  'services/progression/achievementService.ts',
], { stdio: 'inherit' });

const require = createRequire(import.meta.url);
const daily = require(join(outDir, 'services/progression/dailyChallengeService.js'));
const weekly = require(join(outDir, 'services/progression/weeklyChallengeService.js'));
const achievements = require(join(outDir, 'services/progression/achievementService.js'));

const puzzleA = daily.createDailyChallengeLevel('2026-08-20');
const puzzleB = daily.createDailyChallengeLevel('2026-08-20');
const puzzleC = daily.createDailyChallengeLevel('2026-08-21');
assert.equal(puzzleA.seed, 'arrownexa-daily-v1-2026-08-20');
assert.deepEqual(puzzleA.arrows.map((arrow) => [arrow.id, arrow.path, arrow.direction]), puzzleB.arrows.map((arrow) => [arrow.id, arrow.path, arrow.direction]));
assert.notEqual(puzzleA.seed, puzzleC.seed);
assert.equal(daily.getDailyDifficulty('2026-08-19'), 'Hard');
assert.equal(daily.getDailyDifficulty('2026-08-20'), 'Normal');

let streak = { current: 0, best: 0, claimedMilestones: {} };
streak = daily.updateChallengeStreak(streak, '2026-08-20');
streak = daily.updateChallengeStreak(streak, '2026-08-21');
streak = daily.updateChallengeStreak(streak, '2026-08-22');
assert.equal(streak.current, 3);
assert.equal(daily.getChallengeStreakRewards(streak).length, 1);
streak = daily.markChallengeMilestonesClaimed(streak);
assert.equal(daily.getChallengeStreakRewards(streak).length, 0);
streak = daily.updateChallengeStreak(streak, '2026-08-24');
assert.equal(streak.current, 1);
assert.equal(streak.best, 3);

let weeklyState = weekly.createWeeklyChallenge('2026-W34', 60);
const performance = { levelNumber: 12, completed: true, stars: 3, moves: 120, mistakes: 0, hintsUsed: 0, livesRemaining: 3, timeSeconds: 90, difficulty: 'Hard', usedExtraLife: false };
weeklyState = weekly.updateWeeklyFromLevel(weeklyState, performance);
assert.ok(weeklyState.objectives.some((objective) => objective.progress > 0));
weeklyState = weekly.updateWeeklyFromDaily(weeklyState, performance);
assert.ok(weeklyState.objectives.every((objective) => objective.progress <= objective.target));

const progress = {
  completedLevels: Object.fromEntries(Array.from({ length: 25 }, (_, index) => [index + 1, 3])),
  levelRecords: Object.fromEntries(Array.from({ length: 10 }, (_, index) => [index + 1, { stars: 3, bestMistakes: 0, bestHintsUsed: 0, bestTimeSeconds: 60, bestMoves: 20 }])),
  dailyChallenges: { '2026-08-20': { completed: true, perfect: true } },
  challengeStreak: { current: 7, best: 7, claimedMilestones: {} },
  achievements: {},
  nexaRank: 10,
  totalArrowsCleared: 520,
};
const firstEval = achievements.evaluateAchievements(progress, performance);
assert.ok(firstEval.unlockedIds.includes('first_escape'));
assert.ok(firstEval.unlockedIds.includes('daily_starter'));
const secondEval = achievements.evaluateAchievements({ ...progress, achievements: firstEval.achievements }, performance);
assert.equal(secondEval.rewards.length, 0);

console.log('Phase 8 retention tests passed: daily, streak, weekly, achievements, and duplicate protection.');
