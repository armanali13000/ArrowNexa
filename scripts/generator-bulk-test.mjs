import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const count = Number(process.argv[2] ?? 100);
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

const started = Date.now();
const distribution = { Easy: 0, Normal: 0, Hard: 0, Expert: 0 };
let totalAttempts = 0;
let totalGenerationMs = 0;
let maxGenerationMs = 0;
let totalDensity = 0;
let totalArrowCount = 0;
let totalScore = 0;
let totalPathLength = 0;
let totalTurns = 0;
let failures = 0;

for (let levelNumber = 1; levelNumber <= count; levelNumber += 1) {
  try {
    const level = createLevel(levelNumber);
    distribution[level.difficulty] += 1;
    totalAttempts += level.generationAttempts;
    totalGenerationMs += level.generationDurationMs;
    maxGenerationMs = Math.max(maxGenerationMs, level.generationDurationMs);
    totalDensity += level.metrics.density;
    totalArrowCount += level.metrics.arrowCount;
    totalScore += level.difficultyScore;
    totalPathLength += level.metrics.averagePathLength;
    totalTurns += level.metrics.averageTurns;
  } catch {
    failures += 1;
  }
}

const duration = Date.now() - started;
const successful = count - failures;
console.log(JSON.stringify({
  requested: count,
  successful,
  failures,
  averageAttempts: Number((totalAttempts / Math.max(1, successful)).toFixed(2)),
  averageGenerationMs: Number((totalGenerationMs / Math.max(1, successful)).toFixed(2)),
  maxGenerationMs,
  averageDensity: Number((totalDensity / Math.max(1, successful)).toFixed(3)),
  averageArrowCount: Number((totalArrowCount / Math.max(1, successful)).toFixed(2)),
  averageDifficultyScore: Number((totalScore / Math.max(1, successful)).toFixed(2)),
  averagePathLength: Number((totalPathLength / Math.max(1, successful)).toFixed(2)),
  averageTurns: Number((totalTurns / Math.max(1, successful)).toFixed(2)),
  wallClockMs: duration,
  difficultyDistribution: distribution,
}, null, 2));

rmSync(outDir, { recursive: true, force: true });
