import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const outDir = join(tmpdir(), 'arrownexa-polish-stress');
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
  'engine/board.ts',
  'engine/moves.ts',
], { stdio: 'inherit' });

const require = createRequire(import.meta.url);
const { createLevel } = require(join(outDir, 'engine/board.js'));
const { canArrowEscape, getValidMoves, isBoardComplete, markArrowRemoved } = require(join(outDir, 'engine/moves.js'));

const runRapidExitSimulation = (levelNumber) => {
  const level = createLevel(levelNumber);
  let arrows = level.arrows.map((arrow) => ({ ...arrow, path: [...arrow.path], state: 'normal' }));
  const completed = new Set();
  let guard = 0;

  while (!isBoardComplete(arrows) && guard < 500) {
    const validMoves = getValidMoves(arrows, level.size);
    assert.ok(validMoves.length > 0, `Level ${levelNumber} stalled with ${arrows.filter((arrow) => arrow.state !== 'removed').length} arrows`);

    const batch = validMoves.slice(0, Math.min(3, validMoves.length));
    batch.forEach((arrowId) => {
      const result = canArrowEscape(arrows, level.size, arrowId);
      assert.equal(result.canEscape, true, `Expected ${arrowId} to escape on level ${levelNumber}`);
      arrows = arrows.map((arrow) => (arrow.id === arrowId ? { ...arrow, state: 'moving' } : arrow));
    });

    batch.forEach((arrowId) => {
      arrows = markArrowRemoved(arrows, arrowId);
      completed.add(arrowId);
    });

    guard += 1;
  }

  assert.equal(completed.size, level.arrows.length, `Level ${levelNumber} should remove every arrow`);
  assert.equal(isBoardComplete(arrows), true, `Level ${levelNumber} should complete exactly once`);
};

[1, 25, 75, 150, 300, 500].forEach(runRapidExitSimulation);

console.log('Polish stress checks passed: rapid exits, moving occupancy, and completion state are stable.');
