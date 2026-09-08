import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const outDir = join(tmpdir(), 'arrownexa-v2-fixtures');
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
  'engine/moves.ts',
  'engine/solver/difficulty.ts',
  'engine/solver/solveLevel.ts',
  'engine/generator/validation.ts',
], { stdio: 'inherit' });

const require = createRequire(import.meta.url);
const { canArrowEscape, getValidMoves, markArrowRemoved } = require(join(outDir, 'engine/moves.js'));
const { analyzeDifficulty } = require(join(outDir, 'engine/solver/difficulty.js'));
const { solveLevel } = require(join(outDir, 'engine/solver/solveLevel.js'));
const { validateLevelGeometry } = require(join(outDir, 'engine/generator/validation.js'));

const arrow = (id, cells, order = 1) => {
  const path = cells.map(([row, col]) => ({ row, col }));
  const previous = path[path.length - 2];
  const head = path[path.length - 1];
  const direction = head.col > previous.col ? 'RIGHT' : head.col < previous.col ? 'LEFT' : head.row > previous.row ? 'DOWN' : 'UP';
  return { id, path, direction, state: 'normal', order };
};

const level = (id, arrows, rows = 6, cols = 6) => ({ id, title: id, size: { rows, cols }, difficulty: 'Easy', arrows, solutionOrder: arrows.map((item) => item.id) });

const run = (name, board, expectedMoves, expectedSolvable, minDepth = 0) => {
  assert.equal(validateLevelGeometry(board), true, `${name}: geometry`);
  assert.deepEqual(getValidMoves(board.arrows, board.size).sort(), expectedMoves.sort(), `${name}: opening moves`);
  const solver = solveLevel(board);
  assert.equal(solver.solvable, expectedSolvable, `${name}: solver`);
  if (expectedSolvable) assert.equal(solver.solution?.length, board.arrows.length, `${name}: solution length`);
  const metrics = analyzeDifficulty(board);
  assert.equal(metrics.initialValidMoves / board.arrows.length, expectedMoves.length / board.arrows.length, `${name}: opening ratio`);
  assert.equal(metrics.dependencyDepth >= minDepth, true, `${name}: dependency depth`);
  return { name, solver: solver.solvable, metrics };
};

const fixtureA = level('fixture-a-free', [arrow('A', [[2, 2], [2, 3]])]);
const fixtureB = level('fixture-b-chain', [
  arrow('B', [[3, 4], [2, 4]]),
  arrow('A', [[2, 1], [2, 2], [2, 3]]),
]);
const fixtureC = level('fixture-c-chain', [
  arrow('C', [[1, 4], [0, 4]]),
  arrow('B', [[3, 4], [2, 4]]),
  arrow('A', [[2, 1], [2, 2], [2, 3]]),
]);
const fixtureD = level('fixture-d-branch', [
  arrow('B', [[3, 4], [2, 4]]),
  arrow('C', [[4, 5], [3, 5]]),
  arrow('A', [[2, 1], [2, 2], [2, 3]]),
]);
const fixtureE = level('fixture-e-multi-open', [
  arrow('A', [[2, 1], [2, 2]]),
  arrow('B', [[3, 4], [3, 3]]),
  arrow('C', [[5, 0], [4, 0]]),
]);
const fixtureF = level('fixture-f-impossible', [
  arrow('A', [[2, 1], [2, 2]]),
  arrow('B', [[2, 4], [2, 3]]),
]);

const results = [
  run('Fixture A', fixtureA, ['A'], true),
  run('Fixture B', fixtureB, ['B'], true, 1),
  run('Fixture C', fixtureC, ['C'], true, 1),
  run('Fixture D', fixtureD, ['B', 'C'], true, 1),
  run('Fixture E', fixtureE, ['A', 'B', 'C'], true),
  run('Fixture F impossible', fixtureF, [], false),
];

console.log(JSON.stringify(results.map(({ name, solver, metrics }) => ({
  name,
  solver,
  openingFreeCount: metrics.initialValidMoves,
  openingFreeRatio: Number((metrics.initialValidMoves / metrics.arrowCount).toFixed(3)),
  dependencyDepth: metrics.dependencyDepth,
  averageTurns: Number(metrics.averageTurns.toFixed(2)),
})), null, 2));

rmSync(outDir, { recursive: true, force: true });
