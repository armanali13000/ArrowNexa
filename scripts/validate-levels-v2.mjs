import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const dataPath = process.argv[2] ?? 'assets/levels/levels-v2-prototype.json';
const expectedLevels = dataPath.includes('prototype')
  ? [1, 5, 10, 25, 50, 75, 100, 150, 250, 350, 450, 500]
  : dataPath.includes('four-gate')
    ? [1, 50, 250, 500]
    : Array.from({ length: 500 }, (_, index) => index + 1);
const outDir = join(tmpdir(), 'arrownexa-v2-validator');
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
  'engine/generator/validation.ts',
  'engine/levels/v2Constructive.ts',
  'engine/levels/v2Profiles.ts',
  'engine/solver/solveLevel.ts',
], { stdio: 'inherit' });

const require = createRequire(import.meta.url);
const { validateLevelGeometry, validatePuzzleQuality, validateVisualQuality } = require(join(outDir, 'engine/generator/validation.js'));
const { getV2QualityScore } = require(join(outDir, 'engine/levels/v2Constructive.js'));
const { getLevelDifficultyProfile } = require(join(outDir, 'engine/levels/v2Profiles.js'));
const { solveLevel } = require(join(outDir, 'engine/solver/solveLevel.js'));
const data = JSON.parse(readFileSync(join(process.cwd(), dataPath), 'utf8'));
const fingerprints = new Set();
const rows = [];

const fingerprintFor = (level) => `${level.size.rows}x${level.size.cols}|${level.arrows
  .map((arrow) => `${arrow.direction}:${arrow.path.map((point) => `${point.row},${point.col}`).join(';')}`)
  .sort()
  .join('|')}`;

for (const level of data.levels) {
  const profile = getLevelDifficultyProfile(level.levelNumber);
  const solver = solveLevel(level, { maxExploredStates: 60000 });
  const geometry = validateLevelGeometry(level);
  const visual = validateVisualQuality(level);
  const puzzle = validatePuzzleQuality(level, level.metrics);
  const fingerprint = fingerprintFor(level);
  const duplicate = fingerprints.has(fingerprint);
  const qualityScore = getV2QualityScore(level, profile);
  const minimumQualityScore = profile.tutorial ? 55 : profile.difficulty === 'Easy' ? 62 : profile.difficulty === 'Normal' ? 68 : profile.difficulty === 'Hard' ? 74 : 78;
  fingerprints.add(fingerprint);
  rows.push({
    level: level.levelNumber,
    chapter: profile.chapter,
    solver: solver.solvable,
    geometry,
    visual,
    puzzle,
    duplicate,
    qualityScore,
    minimumQualityScore,
    quality: solver.solvable && geometry && !duplicate && qualityScore >= minimumQualityScore,
  });
}

const summary = {
  total: rows.length,
  expectedTotal: expectedLevels.length,
  missingLevels: expectedLevels.filter((levelNumber) => !data.levels.some((level) => level.levelNumber === levelNumber)),
  solverPassed: rows.filter((row) => row.solver).length,
  solverFailed: rows.filter((row) => !row.solver).length,
  qualityPassed: rows.filter((row) => row.quality).length,
  qualityFailed: rows.filter((row) => !row.quality).length,
  duplicateBoards: rows.filter((row) => row.duplicate).length,
  rows,
};

console.log(JSON.stringify(summary, null, 2));
rmSync(outDir, { recursive: true, force: true });
if (summary.total !== summary.expectedTotal || summary.missingLevels.length || summary.solverFailed || summary.qualityFailed || summary.duplicateBoards) process.exit(1);
