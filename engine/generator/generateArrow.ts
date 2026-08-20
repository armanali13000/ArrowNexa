import { PuzzleArrow, LevelGenerationConfig } from '../types/game';
import { generatePathCandidate } from './pathGenerator';
import { SeededRandom } from './seededRandom';
import { cellKey } from '../occupancy';

export const generateArrowCandidate = (config: LevelGenerationConfig, random: SeededRandom, occupied: Set<string>, index: number): PuzzleArrow | undefined => {
  const candidate = generatePathCandidate(config, random, occupied);
  if (!candidate) return undefined;
  return {
    id: `g-${String(index + 1).padStart(3, '0')}`,
    path: candidate.path,
    direction: candidate.direction,
    state: 'normal',
    order: index + 1,
  };
};

export const addArrowCells = (occupied: Set<string>, arrow: PuzzleArrow) => {
  arrow.path.forEach((point) => occupied.add(cellKey(point)));
};
