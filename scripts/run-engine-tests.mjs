import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { rmSync } from 'node:fs';
import { join } from 'node:path';

const outDir = join(process.cwd(), '.tmp-engine-tests');
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
  ],
  { stdio: 'inherit' },
);

const require = createRequire(import.meta.url);
const { canArrowEscape, getBlockingArrow, getValidMoves, isBoardComplete, markArrowRemoved } = require(join(outDir, 'engine/moves.js'));
const { phaseTwoTestLevels } = require(join(outDir, 'engine/levels/testLevels.js'));

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

console.log('Engine tests passed');
rmSync(outDir, { recursive: true, force: true });
