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
  | 'menuMusic'
  | 'gameplayMusic';

type SoundCategory = 'ui' | 'gameplay' | 'reward' | 'music';

export type SoundDefinition = {
  id: SoundId;
  category: SoundCategory;
  volume: number;
  loop?: boolean;
  source: AudioSource;
};

export const soundRegistry: Record<SoundId, SoundDefinition> = {
  tap: { id: 'tap', category: 'ui', volume: 0.38, source: require('../../assets/sounds/tap.wav') },
  arrowMove: { id: 'arrowMove', category: 'gameplay', volume: 0.5, source: require('../../assets/sounds/arrow_escape.wav') },
  arrowBlocked: { id: 'arrowBlocked', category: 'gameplay', volume: 0.46, source: require('../../assets/sounds/blocked.wav') },
  lifeLost: { id: 'lifeLost', category: 'gameplay', volume: 0.52, source: require('../../assets/sounds/life_lost.wav') },
  hint: { id: 'hint', category: 'ui', volume: 0.44, source: require('../../assets/sounds/hint.wav') },
  undo: { id: 'undo', category: 'ui', volume: 0.42, source: require('../../assets/sounds/undo.wav') },
  booster: { id: 'booster', category: 'ui', volume: 0.5, source: require('../../assets/sounds/booster.wav') },
  star: { id: 'star', category: 'reward', volume: 0.44, source: require('../../assets/sounds/star.wav') },
  rankUp: { id: 'rankUp', category: 'reward', volume: 0.56, source: require('../../assets/sounds/rank_up.wav') },
  levelComplete: { id: 'levelComplete', category: 'reward', volume: 0.62, source: require('../../assets/sounds/level_complete.wav') },
  gameOver: { id: 'gameOver', category: 'gameplay', volume: 0.56, source: require('../../assets/sounds/game_over.wav') },
  dailyReward: { id: 'dailyReward', category: 'reward', volume: 0.52, source: require('../../assets/sounds/daily_reward.wav') },
  menuMusic: { id: 'menuMusic', category: 'music', volume: 0.14, loop: true, source: require('../../assets/sounds/menu_music.wav') },
  gameplayMusic: { id: 'gameplayMusic', category: 'music', volume: 0.12, loop: true, source: require('../../assets/sounds/game_music.wav') },
};
