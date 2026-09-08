import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const outDir = join(tmpdir(), 'arrownexa-validate-all-500');
const tscBin = join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc');
const totalLevels = Math.max(1, Math.min(500, Number(process.argv[2] ?? 500)));

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
  'engine/levels/levelFactory.ts',
  'engine/generator/validation.ts',
], { stdio: 'inherit' });

const require = createRequire(import.meta.url);
const { createLevel } = require(join(outDir, 'engine/levels/levelFactory.js'));
const { validatePuzzleQuality, validateVisualQuality } = require(join(outDir, 'engine/generator/validation.js'));
const { solveLevel } = require(join(outDir, 'engine/solver/solveLevel.js'));

const chapters = Array.from({ length: 10 }, (_, index) => ({
  chapter: index + 1,
  count: 0,
  passed: 0,
  failed: 0,
  arrows: 0,
  density: 0,
  openings: 0,
  depth: 0,
  turns: 0,
  score: 0,
  generationMs: 0,
  maxGenerationMs: 0,
}));
const failures = [];
const started = Date.now();

for (let levelNumber = 1; levelNumber <= totalLevels; levelNumber += 1) {
  const levelStart = Date.now();
  const level = createLevel(levelNumber);
  const solver = solveLevel(level, { maxExploredStates: 50000 });
  const visual = validateVisualQuality(level);
  const puzzle = validatePuzzleQuality(level, level.metrics);
  const elapsed = Date.now() - levelStart;
  const chapter = chapters[Math.floor((levelNumber - 1) / 50)];
  const passed = solver.solvable && visual && puzzle;

  chapter.count += 1;
  chapter.passed += passed ? 1 : 0;
  chapter.failed += passed ? 0 : 1;
  chapter.arrows += level.metrics.arrowCount;
  chapter.density += level.metrics.density;
  chapter.openings += level.metrics.initialValidMoves;
  chapter.depth += level.metrics.dependencyDepth;
  chapter.turns += level.metrics.averageTurns;
  chapter.score += level.difficultyScore;
  chapter.generationMs += elapsed;
  chapter.maxGenerationMs = Math.max(chapter.maxGenerationMs, elapsed);

  if (!passed) failures.push({ levelNumber, solver: solver.solvable, visual, puzzle, metrics: level.metrics });

  console.log([
    `level=${levelNumber}`,
    `chapter=${chapter.chapter}`,
    `difficulty=${level.difficulty}`,
    `arrows=${level.metrics.arrowCount}`,
    `density=${level.metrics.density.toFixed(3)}`,
    `opening=${level.metrics.initialValidMoves}`,
    `depth=${level.metrics.dependencyDepth}`,
    `path=${level.metrics.averagePathLength.toFixed(2)}`,
    `turns=${level.metrics.averageTurns.toFixed(2)}`,
    `solvable=${solver.solvable}`,
    `ms=${elapsed}`,
  ].join(' '));
}

const summarize = (chapter) => ({
  chapter: chapter.chapter,
  passed: chapter.passed,
  failed: chapter.failed,
  averageArrowCount: Number((chapter.arrows / chapter.count).toFixed(2)),
  averageDensity: Number((chapter.density / chapter.count).toFixed(3)),
  averageOpeningValidMoves: Number((chapter.openings / chapter.count).toFixed(2)),
  averageDependencyDepth: Number((chapter.depth / chapter.count).toFixed(2)),
  averageTurns: Number((chapter.turns / chapter.count).toFixed(2)),
  difficultyScore: Number((chapter.score / chapter.count).toFixed(2)),
  averageGenerationTimeMs: Number((chapter.generationMs / chapter.count).toFixed(2)),
  maximumGenerationTimeMs: chapter.maxGenerationMs,
});

const totalPassed = chapters.reduce((sum, chapter) => sum + chapter.passed, 0);
const totalFailed = chapters.reduce((sum, chapter) => sum + chapter.failed, 0);
const totalMs = chapters.reduce((sum, chapter) => sum + chapter.generationMs, 0);
const maxMs = Math.max(...chapters.map((chapter) => chapter.maxGenerationMs));

console.log(JSON.stringify({
  totalTested: totalLevels,
  passed: totalPassed,
  failed: totalFailed,
  averageGenerationTimeMs: Number((totalMs / totalLevels).toFixed(2)),
  maximumGenerationTimeMs: maxMs,
  wallClockMs: Date.now() - started,
  chapters: chapters.map(summarize),
  failures,
}, null, 2));

rmSync(outDir, { recursive: true, force: true });
