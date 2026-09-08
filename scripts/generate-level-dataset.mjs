import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const outDir = join(tmpdir(), 'arrownexa-v2-generator');
const tscBin = join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc');
const prototypeLevels = [1, 5, 10, 25, 50, 75, 100, 150, 250, 350, 450, 500];
const fourGateLevels = [1, 50, 250, 500];
const requested = process.argv.includes('--all')
  ? Array.from({ length: 500 }, (_, index) => index + 1)
  : process.argv.includes('--four')
    ? fourGateLevels
  : prototypeLevels;
const constructiveOnly = !process.argv.includes('--all');
const maxAttempts = Number(process.env.MAX_ATTEMPTS_PER_LEVEL ?? 240);

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
  'engine/generator/generateLevel.ts',
  'engine/generator/validation.ts',
  'engine/levels/levelConfig.ts',
  'engine/levels/v2Constructive.ts',
  'engine/levels/v2Profiles.ts',
  'engine/solver/solveLevel.ts',
], { stdio: 'inherit' });

const require = createRequire(import.meta.url);
const { generateLevelFromConfig } = require(join(outDir, 'engine/generator/generateLevel.js'));
const { validateLevelGeometry, validatePuzzleQuality, validateVisualQuality } = require(join(outDir, 'engine/generator/validation.js'));
const { createGenerationConfig, createLevelSeed, GENERATION_VERSION } = require(join(outDir, 'engine/levels/levelConfig.js'));
const { createConstructiveV2Level, getV2QualityScore } = require(join(outDir, 'engine/levels/v2Constructive.js'));
const { getLevelDifficultyProfile } = require(join(outDir, 'engine/levels/v2Profiles.js'));
const { solveLevel } = require(join(outDir, 'engine/solver/solveLevel.js'));

const fingerprints = new Set();
const levels = [];
const report = [];
const failures = [];
const diagnostics = [];

const fingerprintFor = (level) => level.arrows
  .map((arrow) => `${arrow.direction}:${arrow.path.map((point) => `${point.row},${point.col}`).join(';')}`)
  .sort()
  .join('|');

const inRange = (value, [min, max]) => value >= min && value <= max;

const minimumQualityScore = (profile) => {
  if (profile.tutorial) return 55;
  if (profile.difficulty === 'Easy') return 62;
  if (profile.difficulty === 'Normal') return 68;
  if (profile.difficulty === 'Hard') return 74;
  return 78;
};

const profileQuality = (level, profile) => {
  const openingRatio = level.metrics.initialValidMoves / Math.max(1, level.metrics.arrowCount);
  const reasons = [];
  if (!profile.tutorial && !inRange(level.metrics.arrowCount, profile.arrowCountRange)) reasons.push('arrowCountOutOfProfile');
  if (!inRange(level.metrics.density, profile.densityRange)) reasons.push('densityOutOfProfile');
  if (!profile.tutorial && !inRange(openingRatio, profile.openingFreeRatioRange)) reasons.push('openingRatioOutOfProfile');
  if (!profile.tutorial && !inRange(level.metrics.dependencyDepth, profile.dependencyDepthRange)) reasons.push('dependencyDepthOutOfProfile');
  if (!profile.tutorial && !inRange(level.metrics.averageTurns, profile.turnComplexity)) reasons.push('turnComplexityOutOfProfile');
  if (!profile.tutorial && !inRange(level.metrics.averagePathLength, profile.pathLengthRange)) reasons.push('pathLengthOutOfProfile');
  if (level.difficultyScore < profile.targetDifficultyScore * 0.78) reasons.push('difficultyScoreTooLow');
  return reasons;
};

const countTurns = (path) => {
  let turns = 0;
  for (let index = 2; index < path.length; index += 1) {
    const previousVector = {
      row: path[index - 1].row - path[index - 2].row,
      col: path[index - 1].col - path[index - 2].col,
    };
    const nextVector = {
      row: path[index].row - path[index - 1].row,
      col: path[index].col - path[index - 1].col,
    };
    if (previousVector.row !== nextVector.row || previousVector.col !== nextVector.col) turns += 1;
  }
  return turns;
};

const rowFor = (level, profile, generationAttempts, solver, visualQuality, puzzleQuality, profileReasons, duplicate) => ({
  level: level.levelNumber,
  chapter: profile.chapter,
  tutorial: profile.tutorial,
  finale: profile.finale,
  arrows: level.metrics.arrowCount,
  occupiedCells: level.metrics.occupiedCells,
  density: Number(level.metrics.density.toFixed(3)),
  openingFreeCount: level.metrics.initialValidMoves,
  openingFreeRatio: Number((level.metrics.initialValidMoves / Math.max(1, level.metrics.arrowCount)).toFixed(3)),
  dependencyDepth: level.metrics.dependencyDepth,
  branching: Number(level.metrics.averageValidMoves.toFixed(2)),
  averageTurns: Number(level.metrics.averageTurns.toFixed(2)),
  maxTurns: Math.max(...level.arrows.map((arrow) => countTurns(arrow.path))),
  averagePathLength: Number(level.metrics.averagePathLength.toFixed(2)),
  maxPathLength: Math.max(...level.arrows.map((arrow) => arrow.path.length)),
  solutionDepth: level.metrics.solutionDepth,
  difficultyScore: Number(level.difficultyScore.toFixed(2)),
  generationAttempts,
  solver: solver.solvable,
  visualQuality,
  puzzleQuality,
  profileQuality: profileReasons.length === 0,
  duplicate,
  qualityScore: getV2QualityScore(level, profile),
  minimumQualityScore: minimumQualityScore(profile),
  quality: solver.solvable && validateLevelGeometry(level) && !duplicate && getV2QualityScore(level, profile) >= minimumQualityScore(profile),
  reasons: profileReasons,
});

const reasonsFor = (candidate, profile, duplicate = false) => {
  if (!candidate) return ['other'];
  const reasons = [];
  const solver = solveLevel(candidate, { maxExploredStates: 60000 });
  const geometry = validateLevelGeometry(candidate);
  const visualQuality = validateVisualQuality(candidate);
  const puzzleQuality = validatePuzzleQuality(candidate, candidate.metrics);
  if (!geometry) reasons.push('geometryInvalid');
  if (!solver.solvable) reasons.push('solverFailed');
  if (candidate.metrics.arrowCount < profile.arrowCountRange[0] || candidate.metrics.arrowCount > profile.arrowCountRange[1]) reasons.push('arrowCount');
  if (candidate.metrics.density < profile.densityRange[0] || candidate.metrics.density > profile.densityRange[1]) reasons.push('density');
  if (!visualQuality) reasons.push('coverage');
  const openingRatio = candidate.metrics.initialValidMoves / Math.max(1, candidate.metrics.arrowCount);
  if (openingRatio < profile.openingFreeRatioRange[0] || openingRatio > profile.openingFreeRatioRange[1]) reasons.push('openingFreeRatio');
  if (candidate.metrics.dependencyDepth < profile.dependencyDepthRange[0] || candidate.metrics.dependencyDepth > profile.dependencyDepthRange[1]) reasons.push('dependencyDepth');
  if (candidate.metrics.averagePathLength < profile.pathLengthRange[0] || candidate.metrics.averagePathLength > profile.pathLengthRange[1]) reasons.push('pathLength');
  if (candidate.metrics.averageTurns < profile.turnComplexity[0] || candidate.metrics.averageTurns > profile.turnComplexity[1]) reasons.push('turnComplexity');
  if (candidate.metrics.averageValidMoves < profile.branchingRange[0] || candidate.metrics.averageValidMoves > profile.branchingRange[1]) reasons.push('branching');
  if (candidate.difficultyScore < profile.targetDifficultyScore * 0.78) reasons.push('difficultyScore');
  if (duplicate) reasons.push('duplicate');
  if (!puzzleQuality && !reasons.includes('openingFreeRatio') && !reasons.includes('dependencyDepth') && !reasons.includes('branching')) reasons.push('other');
  return reasons;
};

for (const levelNumber of requested) {
  const profile = getLevelDifficultyProfile(levelNumber);
  let accepted;
  let acceptedRow;
  const counters = {
    attempts: 0,
    structurallyValid: 0,
    solverSolvable: 0,
    geometryInvalid: 0,
    pathCollision: 0,
    arrowCollision: 0,
    outOfBounds: 0,
    solverFailed: 0,
    arrowCount: 0,
    density: 0,
    coverage: 0,
    openingFreeRatio: 0,
    dependencyDepth: 0,
    pathLength: 0,
    turnComplexity: 0,
    branching: 0,
    difficultyScore: 0,
    duplicate: 0,
    other: 0,
  };
  let closestCandidate;

  const constructive = createConstructiveV2Level(levelNumber);
  if (constructive) {
    const solver = solveLevel(constructive, { maxExploredStates: 60000 });
    const visualQuality = validateVisualQuality(constructive);
    const puzzleQuality = validatePuzzleQuality(constructive, constructive.metrics);
    const duplicate = fingerprints.has(fingerprintFor(constructive));
    const profileReasons = profileQuality(constructive, profile);
    const row = rowFor(constructive, profile, 1, solver, visualQuality, puzzleQuality, profileReasons, duplicate);
    counters.attempts += 1;
    if (validateLevelGeometry(constructive)) counters.structurallyValid += 1;
    if (solver.solvable) counters.solverSolvable += 1;
    for (const reason of reasonsFor(constructive, profile, duplicate)) counters[reason] += 1;
    closestCandidate = row;
    if (row.quality) {
      accepted = constructive;
      acceptedRow = row;
    }
  }

  if (!accepted && constructiveOnly) {
    failures.push({ level: levelNumber, message: `LEVEL GENERATION FAILED: LEVEL ${levelNumber}`, maxAttempts: 1, profile, counters, closestCandidate });
    diagnostics.push({ level: levelNumber, profile, counters, closestCandidate });
    console.error(`LEVEL GENERATION FAILED: LEVEL ${levelNumber}`);
    continue;
  }

  for (let attempt = 0; !accepted && attempt < maxAttempts; attempt += 1) {
    const seed = `ARROWNEXA_V2_LEVEL_${levelNumber}_ATTEMPT_${attempt}`;
    const config = createGenerationConfig(levelNumber, seed);
    const candidate = generateLevelFromConfig({ ...config, seed }, levelNumber, attempt);
    counters.attempts += 1;
    if (!candidate) {
      counters.other += 1;
      continue;
    }

    const solver = solveLevel(candidate, { maxExploredStates: 60000 });
    const visualQuality = validateVisualQuality(candidate);
    const puzzleQuality = validatePuzzleQuality(candidate, candidate.metrics);
    const duplicate = fingerprints.has(fingerprintFor(candidate));
    const profileReasons = profileQuality(candidate, profile);
    const row = rowFor(candidate, profile, attempt + 1, solver, visualQuality, puzzleQuality, profileReasons, duplicate);
    if (validateLevelGeometry(candidate)) counters.structurallyValid += 1;
    if (solver.solvable) counters.solverSolvable += 1;
    for (const reason of reasonsFor(candidate, profile, duplicate)) counters[reason] += 1;
    if (!closestCandidate || row.qualityScore > closestCandidate.qualityScore) closestCandidate = row;
    if (!row.quality) continue;

    accepted = {
      ...candidate,
      id: `v2-${String(levelNumber).padStart(3, '0')}`,
      generationVersion: GENERATION_VERSION,
      seed,
      generationAttempts: attempt + 1,
    };
    acceptedRow = { ...row, generationAttempts: attempt + 1 };
    break;
  }

  if (!accepted || !acceptedRow) {
    failures.push({ level: levelNumber, message: `LEVEL GENERATION FAILED: LEVEL ${levelNumber}`, maxAttempts, profile, counters, closestCandidate });
    diagnostics.push({ level: levelNumber, profile, counters, closestCandidate });
    console.error(`LEVEL GENERATION FAILED: LEVEL ${levelNumber}`);
    continue;
  }

  fingerprints.add(fingerprintFor(accepted));
  levels.push(accepted);
  report.push(acceptedRow);
  diagnostics.push({ level: levelNumber, profile, counters, closestCandidate: acceptedRow });
  console.log(`accepted level=${levelNumber} attempts=${accepted.generationAttempts} score=${accepted.difficultyScore.toFixed(2)}`);
}

const isFourGate = requested.length === fourGateLevels.length && requested.every((level, index) => level === fourGateLevels[index]);
const dataPath = join(process.cwd(), requested.length === 500 ? 'assets/levels/levels-v2.json' : isFourGate ? 'assets/levels/levels-v2-four-gate.json' : 'assets/levels/levels-v2-prototype.json');
const reportPath = join(process.cwd(), requested.length === 500 ? 'reports/levels-v2-quality.json' : isFourGate ? 'reports/levels-v2-four-gate-quality.json' : 'reports/levels-v2-prototype-quality.json');
const tsPath = join(process.cwd(), 'engine/levels/levelsV2Prototype.ts');
mkdirSync(dirname(dataPath), { recursive: true });
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(dataPath, `${JSON.stringify({ version: 2, levels }, null, 2)}\n`);
writeFileSync(reportPath, `${JSON.stringify({ version: 2, generatedAt: new Date().toISOString(), requested, maxAttempts, total: levels.length, failures, diagnostics, levels: report }, null, 2)}\n`);

if (requested.length !== 500 && !isFourGate) {
  writeFileSync(tsPath, [
    "import { GeneratedLevel } from '../types/game';",
    '',
    'export const LEVEL_SYSTEM_V2_VERSION = 2;',
    '',
    `export const levelsV2Prototype: GeneratedLevel[] = ${JSON.stringify(levels, null, 2)};`,
    '',
  ].join('\n'));
}

rmSync(outDir, { recursive: true, force: true });
if (failures.length) process.exit(1);
