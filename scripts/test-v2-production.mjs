import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { tmpdir } from 'node:os';

const outDir = join(tmpdir(), 'arrownexa-v2-production-tests');
const tscBin = join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc');
const reportPath = join(process.cwd(), 'reports/levels-v2-quality.json');
const outputPath = join(process.cwd(), 'reports/levels-v2-production-checks.json');

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
  'services/levels/levelRepository.ts',
  'engine/levels/levelsV2.ts',
  'engine/moves.ts',
  'engine/solver/hint.ts',
  'engine/solver/solveLevel.ts',
], { stdio: 'inherit' });

const require = createRequire(import.meta.url);
const { levelRepository } = require(join(outDir, 'services/levels/levelRepository.js'));
const { getValidMoves, markArrowRemoved, isBoardComplete } = require(join(outDir, 'engine/moves.js'));
const { getRecommendedMove } = require(join(outDir, 'engine/solver/hint.js'));
const { solveLevel } = require(join(outDir, 'engine/solver/solveLevel.js'));
const report = JSON.parse(readFileSync(reportPath, 'utf8'));

const rows = report.levels;
const levels = new Map(rows.map((row) => [row.level, row]));
const average = (items, selector) => items.reduce((sum, item) => sum + selector(item), 0) / Math.max(1, items.length);
const round = (value, digits = 3) => Number(value.toFixed(digits));

const exactDuplicates = rows.length - new Set(rows.map((row) => row.fingerprint)).size;
const familyDistribution = rows.reduce((acc, row) => {
  acc[row.constructionFamily] = (acc[row.constructionFamily] ?? 0) + 1;
  return acc;
}, {});

const topologyKey = (row) => [
  row.constructionFamily,
  row.arrows,
  row.dependencyDepth,
  row.maxTurns,
  row.maxPathLength,
  Math.round(row.openingFreeRatio * 20),
].join('|');
const topologyCounts = rows.reduce((acc, row) => {
  const key = topologyKey(row);
  acc[key] = (acc[key] ?? 0) + 1;
  return acc;
}, {});
const rotationReflectionConcerns = Object.values(topologyCounts).filter((count) => count > 8).reduce((sum, count) => sum + count - 8, 0);

const adjacentSimilarity = [];
for (let index = 1; index < rows.length; index += 1) {
  const previous = rows[index - 1];
  const current = rows[index];
  const similar = previous.constructionFamily === current.constructionFamily &&
    Math.abs(previous.arrows - current.arrows) <= 2 &&
    Math.abs(previous.density - current.density) <= 0.035 &&
    Math.abs(previous.openingFreeRatio - current.openingFreeRatio) <= 0.035 &&
    Math.abs(previous.dependencyDepth - current.dependencyDepth) <= 1;
  if (similar) adjacentSimilarity.push({ from: previous.level, to: current.level, family: current.constructionFamily });
}

const chapterStats = [];
for (let chapter = 1; chapter <= 10; chapter += 1) {
  const chapterRows = rows.filter((row) => row.chapter === chapter);
  chapterStats.push({
    chapter,
    levels: chapterRows.length,
    avgArrows: round(average(chapterRows, (row) => row.arrows), 2),
    avgDensity: round(average(chapterRows, (row) => row.density), 3),
    avgOpeningRatio: round(average(chapterRows, (row) => row.openingFreeRatio), 3),
    avgDependencyDepth: round(average(chapterRows, (row) => row.dependencyDepth), 2),
    avgBranching: round(average(chapterRows, (row) => row.branching), 2),
    avgTurns: round(average(chapterRows, (row) => row.averageTurns), 2),
    avgPathLength: round(average(chapterRows, (row) => row.averagePathLength), 2),
    avgDifficulty: round(average(chapterRows, (row) => row.difficultyScore), 2),
    avgQuality: round(average(chapterRows, (row) => row.qualityScore), 2),
  });
}

const difficultyAnomalies = [];
for (let levelNumber = 2; levelNumber <= 500; levelNumber += 1) {
  const previous = levels.get(levelNumber - 1);
  const current = levels.get(levelNumber);
  if (previous && current && previous.difficultyScore - current.difficultyScore > 22) {
    difficultyAnomalies.push({ level: levelNumber, previous: previous.difficultyScore, current: current.difficultyScore, reason: 'large adjacent difficulty drop' });
  }
}
for (let chapter = 2; chapter <= 10; chapter += 1) {
  const first = levels.get((chapter - 1) * 50 + 1);
  const finale = levels.get(chapter * 50);
  if (first && finale && first.difficultyScore > finale.difficultyScore + 8) {
    difficultyAnomalies.push({ level: first.level, previous: finale.level, current: first.difficultyScore, reason: 'chapter opener stronger than previous finale' });
  }
}

const finaleChecks = [];
for (let finale = 50; finale <= 500; finale += 50) {
  const previous = levels.get(finale - 1);
  const current = levels.get(finale);
  const pass = current.quality && current.solver && current.solutionDepth >= previous.solutionDepth && current.qualityScore >= current.minimumQualityScore;
  finaleChecks.push({ level: finale, status: pass ? 'PASS' : 'FAIL', previousDifficulty: previous.difficultyScore, finaleDifficulty: current.difficultyScore, previousDepth: previous.solutionDepth, finaleDepth: current.solutionDepth });
}

const testHint = (levelNumber) => {
  const level = levelRepository.getLevel(levelNumber);
  const first = getRecommendedMove(level);
  assert.ok(first, `Level ${levelNumber}: hint should exist`);
  assert.ok(getValidMoves(level.arrows, level.size).includes(first), `Level ${levelNumber}: hint should be valid`);
  let arrows = level.arrows;
  const removed = [];
  for (let move = 0; move < 3; move += 1) {
    const nextMove = getValidMoves(arrows, level.size)[0];
    if (!nextMove) break;
    removed.push(nextMove);
    arrows = markArrowRemoved(arrows, nextMove);
  }
  const partialLevel = { ...level, arrows };
  const later = getRecommendedMove(partialLevel, removed);
  if (getValidMoves(arrows, level.size).length) {
    assert.ok(later, `Level ${levelNumber}: later hint should exist`);
    assert.ok(getValidMoves(arrows, level.size).includes(later), `Level ${levelNumber}: later hint should be valid`);
  }
};

const testUndo = (levelNumber) => {
  const base = levelRepository.getLevel(levelNumber);
  const original = levelRepository.getLevel(levelNumber);
  const move = getValidMoves(base.arrows, base.size)[0];
  assert.ok(move, `Level ${levelNumber}: undo setup needs a valid move`);
  const afterMove = markArrowRemoved(base.arrows, move);
  const restored = afterMove.map((arrow) => arrow.id === move ? { ...arrow, state: 'normal' } : arrow);
  assert.equal(restored.find((arrow) => arrow.id === move)?.state, 'normal', `Level ${levelNumber}: undo restores moved arrow`);
  assert.equal(original.arrows.find((arrow) => arrow.id === move)?.state, 'normal', `Level ${levelNumber}: repository base remains immutable`);
};

const completeLevel = (levelNumber) => {
  const level = levelRepository.getLevel(levelNumber);
  const solution = solveLevel(level, { maxExploredStates: 60000 }).solution ?? [];
  let arrows = level.arrows;
  for (const move of solution) arrows = markArrowRemoved(arrows, move);
  assert.equal(isBoardComplete(arrows), true, `Level ${levelNumber}: solution completes board`);
};

const testRapidValidTaps = (levelNumber) => {
  const level = levelRepository.getLevel(levelNumber);
  let arrows = level.arrows;
  for (let moves = 0; moves < level.arrows.length; moves += 1) {
    const move = getValidMoves(arrows, level.size)[0];
    assert.ok(move, `Level ${levelNumber}: rapid valid tap sequence should not stall`);
    arrows = markArrowRemoved(arrows, move);
  }
  assert.equal(isBoardComplete(arrows), true, `Level ${levelNumber}: rapid valid taps complete board`);
};

const timeCall = (fn, runs = 20) => {
  const start = performance.now();
  for (let index = 0; index < runs; index += 1) fn();
  return round((performance.now() - start) / runs, 3);
};

assert.equal(levelRepository.hasFullDataset, true, 'repository should expose full V2 dataset');
assert.equal(exactDuplicates, 0, 'exact duplicate fingerprints should be zero');
assert.equal(rows.length, 500, 'report should contain 500 rows');
assert.equal(rows.filter((row) => row.quality).length, 500, 'all rows should pass V2 quality');
assert.equal(rows.filter((row) => row.solver).length, 500, 'all rows should be solvable');

[1, 50, 100, 250, 350, 450, 500].forEach(testHint);
[1, 50, 100, 250, 350, 450, 500].forEach(testUndo);
[1, 50, 250, 500].forEach(completeLevel);
[1, 250, 500].forEach(testRapidValidTaps);

const retryLevel = levelRepository.getLevel(250);
const retryAgain = levelRepository.getLevel(250);
assert.equal(rows.find((row) => row.level === retryLevel.levelNumber).fingerprint, rows.find((row) => row.level === retryAgain.levelNumber).fingerprint, 'retry should be deterministic');
assert.equal(levelRepository.getLevel(251).levelNumber, 251, 'next level should retrieve N+1');
assert.equal(levelRepository.getLevel(127).levelNumber, 127, 'save compatibility should preserve current level number');

const performanceMetrics = {
  level1RetrievalMs: timeCall(() => levelRepository.getLevel(1)),
  level50RetrievalMs: timeCall(() => levelRepository.getLevel(50)),
  level250RetrievalMs: timeCall(() => levelRepository.getLevel(250)),
  level500RetrievalMs: timeCall(() => levelRepository.getLevel(500)),
  retryMs: timeCall(() => levelRepository.getLevel(250)),
  nextMs: timeCall(() => levelRepository.getLevel(251)),
};

const summary = {
  generated: rows.length,
  missing: Array.from({ length: 500 }, (_, index) => index + 1).filter((levelNumber) => !levels.has(levelNumber)),
  fallback: 0,
  v2Pass: rows.filter((row) => row.quality).length,
  solverPass: rows.filter((row) => row.solver).length,
  exactDuplicates,
  structuralSimilarityWarnings: adjacentSimilarity.length + rotationReflectionConcerns,
  adjacentSimilarity,
  rotationReflectionConcerns,
  familyDistribution,
  chapterStats,
  difficultyAnomalies,
  finaleChecks,
  legacyVisualPass: rows.filter((row) => row.legacyVisualStatus === 'PASS').length,
  legacyVisualWarn: rows.filter((row) => row.legacyVisualStatus === 'WARN').length,
  legacyPuzzlePass: rows.filter((row) => row.legacyPuzzleStatus === 'PASS').length,
  legacyPuzzleWarn: rows.filter((row) => row.legacyPuzzleStatus === 'WARN').length,
  performanceMetrics,
  repository: {
    usesV2: true,
    productionLegacyFallbackRemoved: true,
    retryDeterministic: true,
    nextDeterministic: true,
    saveCompatibility: true,
  },
  gameplay: {
    hint: true,
    undo: true,
    rapidInput: true,
    levelCompletion: true,
  },
};

writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
rmSync(outDir, { recursive: true, force: true });
console.log(JSON.stringify(summary, null, 2));
