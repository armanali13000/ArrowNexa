import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const samplesPerDifficulty = Number(process.argv[2] ?? 100);
const outDir = join(tmpdir(), 'arrownexa-generator-bulk');
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
  'engine/levels/levelFactory.ts',
], { stdio: 'inherit' });

const require = createRequire(import.meta.url);
const { createLevel } = require(join(outDir, 'engine/levels/levelFactory.js'));
const { calculateVisualCoverage } = require(join(outDir, 'engine/generator/density.js'));

const started = Date.now();
const difficulties = ['Easy', 'Normal', 'Hard', 'Expert'];
const stats = Object.fromEntries(difficulties.map((difficulty) => [difficulty, {
  count: 0,
  totalAttempts: 0,
  totalGenerationMs: 0,
  maxGenerationMs: 0,
  totalDensity: 0,
  totalArrowCount: 0,
  totalScore: 0,
  totalPathLength: 0,
  totalTurns: 0,
  totalCoverage: 0,
  fallbackCount: 0,
}]));
let failures = 0;
let levelNumber = 1;

while (difficulties.some((difficulty) => stats[difficulty].count < samplesPerDifficulty) && levelNumber <= 2000) {
  try {
    const level = createLevel(levelNumber);
    const bucket = stats[level.difficulty];
    if (bucket.count < samplesPerDifficulty) {
      const coverage = calculateVisualCoverage(level.arrows, level.size.rows, level.size.cols);
      bucket.count += 1;
      bucket.totalAttempts += level.generationAttempts;
      bucket.totalGenerationMs += level.generationDurationMs;
      bucket.maxGenerationMs = Math.max(bucket.maxGenerationMs, level.generationDurationMs);
      bucket.totalDensity += level.metrics.density;
      bucket.totalArrowCount += level.metrics.arrowCount;
      bucket.totalScore += level.difficultyScore;
      bucket.totalPathLength += level.metrics.averagePathLength;
      bucket.totalTurns += level.metrics.averageTurns;
      bucket.totalCoverage += coverage.usedAreaRatio;
      bucket.fallbackCount += level.generationAttempts === 0 ? 1 : 0;
    }
  } catch {
    failures += 1;
  }
  levelNumber += 1;
}

const duration = Date.now() - started;
const successful = difficulties.reduce((sum, difficulty) => sum + stats[difficulty].count, 0);
const summarize = (bucket) => ({
  count: bucket.count,
  fallbackCount: bucket.fallbackCount,
  averageAttempts: Number((bucket.totalAttempts / Math.max(1, bucket.count)).toFixed(2)),
  averageGenerationMs: Number((bucket.totalGenerationMs / Math.max(1, bucket.count)).toFixed(2)),
  maxGenerationMs: bucket.maxGenerationMs,
  averageDensity: Number((bucket.totalDensity / Math.max(1, bucket.count)).toFixed(3)),
  averageCoverage: Number((bucket.totalCoverage / Math.max(1, bucket.count)).toFixed(3)),
  averageArrowCount: Number((bucket.totalArrowCount / Math.max(1, bucket.count)).toFixed(2)),
  averageDifficultyScore: Number((bucket.totalScore / Math.max(1, bucket.count)).toFixed(2)),
  averagePathLength: Number((bucket.totalPathLength / Math.max(1, bucket.count)).toFixed(2)),
  averageTurns: Number((bucket.totalTurns / Math.max(1, bucket.count)).toFixed(2)),
});

console.log(JSON.stringify({
  requestedPerDifficulty: samplesPerDifficulty,
  successful,
  failures,
  scannedLevels: levelNumber - 1,
  wallClockMs: duration,
  byDifficulty: Object.fromEntries(difficulties.map((difficulty) => [difficulty, summarize(stats[difficulty])])),
}, null, 2));

rmSync(outDir, { recursive: true, force: true });
