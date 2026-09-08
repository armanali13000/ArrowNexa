import { Difficulty } from '../types/game';

export type LevelDifficultyProfile = {
  chapter: number;
  chapterProgress: number;
  arrowCountRange: [number, number];
  densityRange: [number, number];
  openingFreeRatioRange: [number, number];
  dependencyDepthRange: [number, number];
  turnComplexity: [number, number];
  pathLengthRange: [number, number];
  branchingRange: [number, number];
  targetDifficultyScore: number;
  difficulty: Difficulty;
  finale: boolean;
  tutorial: boolean;
};

const lerp = (min: number, max: number, progress: number) => min + (max - min) * progress;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const chapterOpenRanges: Array<[number, number]> = [
  [0.35, 0.65],
  [0.30, 0.55],
  [0.25, 0.45],
  [0.20, 0.40],
  [0.18, 0.35],
  [0.15, 0.30],
  [0.12, 0.27],
  [0.10, 0.24],
  [0.08, 0.22],
  [0.06, 0.20],
];

export const getLevelDifficultyProfile = (levelNumber: number): LevelDifficultyProfile => {
  const clamped = Math.max(1, Math.min(500, levelNumber));
  const chapter = Math.floor((clamped - 1) / 50) + 1;
  const chapterLevel = ((clamped - 1) % 50) + 1;
  const chapterProgress = (chapterLevel - 1) / 49;
  const globalProgress = (clamped - 1) / 499;
  const finale = chapterLevel === 50;
  const tutorial = clamped <= 5;
  const finaleBoost = finale ? 0.12 : 0;
  const difficulty: Difficulty = globalProgress < 0.08 ? 'Easy' : globalProgress < 0.34 ? 'Normal' : globalProgress < 0.68 ? 'Hard' : 'Expert';
  const baseArrowMin = Math.round(lerp(8, 48, globalProgress) + chapterProgress * 4 + finaleBoost * 20);
  const baseArrowMax = Math.round(baseArrowMin + lerp(5, 18, globalProgress));
  const openingRange = chapterOpenRanges[chapter - 1];

  return {
    chapter,
    chapterProgress,
    arrowCountRange: tutorial ? [6 + chapterLevel, 10 + chapterLevel] : [baseArrowMin, baseArrowMax],
    densityRange: [clamp(lerp(0.34, 0.62, globalProgress), 0.28, 0.7), clamp(lerp(0.54, 0.78, globalProgress) + finaleBoost, 0.5, 0.82)],
    openingFreeRatioRange: finale ? [openingRange[0], Math.max(openingRange[0], openingRange[1] - 0.08)] : openingRange,
    dependencyDepthRange: tutorial ? [0, 2] : [Math.floor(lerp(1, 7, globalProgress)), Math.ceil(lerp(3, 12, globalProgress) + finaleBoost * 12)],
    turnComplexity: [lerp(0.2, 1.2, globalProgress), lerp(1.1, 2.8, globalProgress)],
    pathLengthRange: [Math.round(lerp(2, 4, globalProgress)), Math.round(lerp(5, 10, globalProgress) + finaleBoost * 8)],
    branchingRange: [lerp(2, 5, globalProgress), lerp(7, 14, globalProgress)],
    targetDifficultyScore: clamp(lerp(18, 96, globalProgress) + finaleBoost * 28, 12, 100),
    difficulty,
    finale,
    tutorial,
  };
};
