import { AudioSource } from 'expo-audio';

export type SoundId =
  | 'tap'
  | 'arrowMove'
  | 'arrowBlocked'
  | 'lifeLost'
  | 'hint'
  | 'undo'
  | 'booster'
  | 'star'
  | 'rankUp'
  | 'levelComplete'
  | 'gameOver'
  | 'dailyReward'
  | 'backgroundLoop';

type SoundCategory = 'ui' | 'gameplay' | 'reward' | 'music';

export type SoundDefinition = {
  id: SoundId;
  category: SoundCategory;
  volume: number;
  loop?: boolean;
  source: AudioSource;
};

const placeholder = null;

export const soundRegistry: Record<SoundId, SoundDefinition> = {
  tap: { id: 'tap', category: 'ui', volume: 0.45, source: placeholder },
  arrowMove: { id: 'arrowMove', category: 'gameplay', volume: 0.55, source: placeholder },
  arrowBlocked: { id: 'arrowBlocked', category: 'gameplay', volume: 0.55, source: placeholder },
  lifeLost: { id: 'lifeLost', category: 'gameplay', volume: 0.58, source: placeholder },
  hint: { id: 'hint', category: 'ui', volume: 0.5, source: placeholder },
  undo: { id: 'undo', category: 'ui', volume: 0.5, source: placeholder },
  booster: { id: 'booster', category: 'ui', volume: 0.62, source: placeholder },
  star: { id: 'star', category: 'reward', volume: 0.52, source: placeholder },
  rankUp: { id: 'rankUp', category: 'reward', volume: 0.7, source: placeholder },
  levelComplete: { id: 'levelComplete', category: 'reward', volume: 0.75, source: placeholder },
  gameOver: { id: 'gameOver', category: 'gameplay', volume: 0.7, source: placeholder },
  dailyReward: { id: 'dailyReward', category: 'reward', volume: 0.65, source: placeholder },
  backgroundLoop: { id: 'backgroundLoop', category: 'music', volume: 0.18, loop: true, source: placeholder },
};
