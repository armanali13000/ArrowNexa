import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const outDir = join(tmpdir(), 'arrownexa-engine-tests');
const tscBin = join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc');

rmSync(outDir, { recursive: true, force: true });
execFileSync(
  process.execPath,
  [
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
    'engine/moves.ts',
    'engine/occupancy.ts',
    'engine/types/game.ts',
    'engine/levels/testLevels.ts',
    'engine/levels/levelFactory.ts',
    'engine/levels/levelConfig.ts',
    'engine/generator/validation.ts',
    'engine/rewards/stars.ts',
    'engine/rewards/rewards.ts',
    'constants/gameBalance.ts',
    'constants/progression.ts',
    'services/progression/xpService.ts',
    'services/progression/dailyRewardService.ts',
    'services/progression/chapterService.ts',
    'services/progression/progressionService.ts',
  ],
  { stdio: 'inherit' },
);

const require = createRequire(import.meta.url);
const { canArrowEscape, getBlockingArrow, getValidMoves, isBoardComplete, markArrowRemoved } = require(join(outDir, 'engine/moves.js'));
const { phaseTwoTestLevels } = require(join(outDir, 'engine/levels/testLevels.js'));
const { createLevel } = require(join(outDir, 'engine/levels/levelFactory.js'));
const { validateLevelGeometry } = require(join(outDir, 'engine/generator/validation.js'));
const { calculateStars } = require(join(outDir, 'engine/rewards/stars.js'));
const { calculateCompletionRewards } = require(join(outDir, 'engine/rewards/rewards.js'));
const { calculateLevelXP, applyXP } = require(join(outDir, 'services/progression/xpService.js'));
const { defaultDailyRewardState, claimDailyReward, getDailyClaimStatus } = require(join(outDir, 'services/progression/dailyRewardService.js'));
const { getChapterForLevel } = require(join(outDir, 'services/progression/chapterService.js'));

const arrow = (id, path, direction, state = 'normal') => ({
  id,
  direction,
  state,
  path: path.map(([row, col]) => ({ row, col })),
});

const size = { rows: 5, cols: 5 };

assert.equal(canArrowEscape([arrow('right', [[2, 0], [2, 1]], 'RIGHT')], size, 'right').canEscape, true, 'right exit should be clear');
assert.equal(canArrowEscape([arrow('left', [[2, 4], [2, 3]], 'LEFT')], size, 'left').canEscape, true, 'left exit should be clear');
assert.equal(canArrowEscape([arrow('up', [[4, 2], [3, 2]], 'UP')], size, 'up').canEscape, true, 'up exit should be clear');
assert.equal(canArrowEscape([arrow('down', [[0, 2], [1, 2]], 'DOWN')], size, 'down').canEscape, true, 'down exit should be clear');

const blocked = [arrow('main', [[2, 0], [2, 1]], 'RIGHT'), arrow('blocker', [[2, 3], [3, 3]], 'DOWN')];
assert.equal(canArrowEscape(blocked, size, 'main').canEscape, false, 'blocked arrow should not escape');
assert.equal(getBlockingArrow(blocked, size, 'main'), 'blocker', 'blocking arrow id should be returned');

assert.equal(canArrowEscape([arrow('self', [[2, 1], [2, 2], [2, 3]], 'RIGHT')], size, 'self').canEscape, true, 'arrow should not block itself');
assert.equal(canArrowEscape([arrow('main', [[2, 0], [2, 1]], 'RIGHT'), arrow('gone', [[2, 3]], 'RIGHT', 'removed')], size, 'main').canEscape, true, 'removed arrows should not block exits');
assert.deepEqual(getValidMoves(blocked, size), ['blocker'], 'only currently free arrows should be valid');
assert.equal(isBoardComplete([arrow('a', [[0, 0]], 'RIGHT', 'removed'), arrow('b', [[1, 0]], 'RIGHT', 'removed')]), true, 'all removed should complete');
assert.equal(isBoardComplete([arrow('a', [[0, 0]], 'RIGHT', 'removed'), arrow('b', [[1, 0]], 'RIGHT')]), false, 'active arrow should prevent completion');

for (const level of phaseTwoTestLevels) {
  let arrows = level.arrows.map((item) => ({ ...item, path: item.path.map((point) => ({ ...point })) }));
  for (const item of arrows) {
    for (let index = 1; index < item.path.length; index += 1) {
      const previous = item.path[index - 1];
      const current = item.path[index];
      const distance = Math.abs(previous.row - current.row) + Math.abs(previous.col - current.col);
      assert.equal(distance, 1, `${level.id}:${item.id} path points must be connected`);
    }
  }
  for (const arrowId of level.solutionOrder) {
    assert.equal(canArrowEscape(arrows, level.size, arrowId).canEscape, true, `${level.id}:${arrowId} should be removable in solution order`);
    arrows = markArrowRemoved(arrows, arrowId);
  }
  assert.equal(isBoardComplete(arrows), true, `${level.id} should complete after solution order`);
}

const generated120a = createLevel(120);
const generated120b = createLevel(120);
const generated121 = createLevel(121);
assert.deepEqual(generated120a.arrows, generated120b.arrows, 'same level seed should produce identical arrows');
assert.notDeepEqual(generated120a.arrows, generated121.arrows, 'different levels should generally differ');
assert.equal(validateLevelGeometry(generated120a), true, 'generated level geometry should be valid');
assert.equal(solveGenerated(generated120a), true, 'generated level should be solvable');

const easy = createLevel(5);
const hard = createLevel(360);
const expert = createLevel(480);
assert.equal(easy.metrics.complexityScore < 76, true, 'early easy level should not classify like Expert');
assert.equal(expert.metrics.complexityScore > easy.metrics.complexityScore, true, 'late level should be harder than early level');
assert.equal(hard.metrics.density >= easy.metrics.density, true, 'later boards should generally be denser');

const cache = new Map();
cache.set(cacheKey(generated120a), JSON.stringify(generated120a));
assert.deepEqual(JSON.parse(cache.get(cacheKey(generated120a))), generated120a, 'cached level should load identically');

assert.equal(calculateStars({ mistakes: 0, hintsUsed: 0, livesRemaining: 3, moves: 10, difficulty: 'Easy' }), 3, 'perfect play should receive 3 stars');
assert.equal(calculateStars({ mistakes: 2, hintsUsed: 1, livesRemaining: 1, moves: 10, difficulty: 'Hard' }), 2, 'small mistakes or hint use should receive 2 stars');
assert.equal(calculateStars({ mistakes: 3, hintsUsed: 2, livesRemaining: 1, moves: 10, difficulty: 'Expert' }), 1, 'rough completion should still receive 1 star');
const rewards = calculateCompletionRewards({ levelNumber: 10, completed: true, stars: 3, moves: 10, mistakes: 0, hintsUsed: 0, livesRemaining: 3, timeSeconds: 30, difficulty: 'Easy', usedExtraLife: false }, {});
assert.equal(rewards.rewards.some((reward) => reward.type === 'hint'), true, 'completion rewards should include hint rewards');
const duplicate = calculateCompletionRewards({ levelNumber: 10, completed: true, stars: 3, moves: 10, mistakes: 0, hintsUsed: 0, livesRemaining: 3, timeSeconds: 30, difficulty: 'Easy', usedExtraLife: false }, { 'milestone:10': true });
assert.equal(duplicate.rewardKeys.includes('milestone:10'), false, 'milestone rewards should not duplicate');
assert.equal(calculateLevelXP('Easy', 3, true), 63, 'first completion should grant performance XP');
assert.equal(calculateLevelXP('Easy', 3, false), 0, 'replay should not grant base XP');
assert.equal(applyXP(10000, 1, 0).rank > 1, true, 'large XP should rank up');
assert.equal(getChapterForLevel(237).chapter, 5, 'level 237 should be in chapter 5');

const dayOne = claimDailyReward(defaultDailyRewardState, '2026-08-20');
assert.equal(dayOne.claimed, true, 'first daily claim should be available');
assert.equal(getDailyClaimStatus(dayOne.state, '2026-08-20').available, false, 'same-day duplicate claim should be blocked');
const dayTwo = claimDailyReward(dayOne.state, '2026-08-21');
assert.equal(dayTwo.claimed, true, 'next calendar day should be claimable');
assert.equal(dayTwo.state.currentStreak, 2, 'consecutive claim should increase streak');
assert.equal(dayTwo.state.cycleDay, 3, 'daily reward cycle should advance after claims');
assert.equal(getDailyClaimStatus(dayTwo.state, '2026-08-19').available, false, 'clock rollback should not grant rewards');

console.log('Engine tests passed');
rmSync(outDir, { recursive: true, force: true });

function solveGenerated(level) {
  let arrows = level.arrows.map((item) => ({ ...item, path: item.path.map((point) => ({ ...point })) }));
  for (const arrowId of level.solutionOrder) {
    if (!canArrowEscape(arrows, level.size, arrowId).canEscape) return false;
    arrows = markArrowRemoved(arrows, arrowId);
  }
  return isBoardComplete(arrows);
}

function cacheKey(level) {
  return `${level.generationVersion}:${level.levelNumber}`;
}
