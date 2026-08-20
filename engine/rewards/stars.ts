import { STAR_RULES } from '../../constants/gameBalance';
import { LevelPerformance } from '../types/game';

export const calculateStars = (performance: Omit<LevelPerformance, 'stars' | 'completed' | 'levelNumber' | 'timeSeconds' | 'usedExtraLife'>) => {
  if (performance.mistakes <= STAR_RULES.three.maxMistakes && performance.hintsUsed <= STAR_RULES.three.maxHintsUsed) return 3;
  if (performance.mistakes <= STAR_RULES.two.maxMistakes && performance.hintsUsed <= STAR_RULES.two.maxHintsUsed) return 2;
  return 1;
};

export const calculatePerformanceScore = (performance: Pick<LevelPerformance, 'mistakes' | 'hintsUsed' | 'livesRemaining' | 'timeSeconds'>) =>
  Math.max(0, Math.min(100, 100 - performance.mistakes * 12 - performance.hintsUsed * 10 + performance.livesRemaining * 3 - Math.floor(performance.timeSeconds / 60)));
