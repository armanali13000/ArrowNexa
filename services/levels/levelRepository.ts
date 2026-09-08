import { levelsV2, LEVEL_SYSTEM_V2_VERSION } from '../../engine/levels/levelsV2';
import { GeneratedLevel, PuzzleArrow } from '../../engine/types/game';

const v2Levels = new Map(levelsV2.map((level) => [level.levelNumber, level]));

const cloneArrows = (arrows: PuzzleArrow[]) => arrows.map((arrow) => ({ ...arrow, path: arrow.path.map((point) => ({ ...point })) }));

export const cloneLevelDefinition = (level: GeneratedLevel): GeneratedLevel => ({
  ...level,
  size: { ...level.size },
  arrows: cloneArrows(level.arrows),
  solutionOrder: [...level.solutionOrder],
  metrics: { ...level.metrics },
});

export const levelRepository = {
  version: LEVEL_SYSTEM_V2_VERSION,
  hasFullDataset: levelsV2.length === 500,
  hasLevel(levelNumber: number) {
    return v2Levels.has(levelNumber);
  },
  getLevel(levelNumber: number) {
    const normalized = Math.max(1, Math.min(500, levelNumber));
    const v2Level = v2Levels.get(normalized);
    if (!v2Level) throw new Error(`MISSING V2 LEVEL: ${normalized}`);
    return cloneLevelDefinition(v2Level);
  },
};
