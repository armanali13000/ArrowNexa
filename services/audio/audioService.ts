import { AudioPlayer, createAudioPlayer, setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';
import { useSettingsStore } from '../../store/settings/settingsStore';
import { SoundId, soundRegistry } from './soundRegistry';

const effectPlayers = new Map<SoundId, AudioPlayer>();
let musicPlayer: AudioPlayer | undefined;
let initialized = false;

const sourceFor = (soundId: SoundId) => soundRegistry[soundId].source;

const hasSource = (soundId: SoundId) => sourceFor(soundId) !== null;

const getEffectPlayer = (soundId: SoundId) => {
  const definition = soundRegistry[soundId];
  if (!definition || definition.category === 'music' || !hasSource(soundId)) return undefined;
  const cached = effectPlayers.get(soundId);
  if (cached) return cached;
  const player = createAudioPlayer(definition.source);
  player.volume = definition.volume;
  effectPlayers.set(soundId, player);
  return player;
};

export const audioService = {
  initialize: async () => {
    if (initialized) return;
    initialized = true;
    await setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false, interruptionMode: 'mixWithOthers' });
    await setIsAudioActiveAsync(true);
  },
  play: async (soundId: SoundId) => {
    if (!useSettingsStore.getState().soundEnabled) return;
    const player = getEffectPlayer(soundId);
    if (!player) return;
    try {
      await player.seekTo(0);
      player.play();
    } catch {
      undefined;
    }
  },
  startMusic: async () => {
    if (!useSettingsStore.getState().musicEnabled || !hasSource('backgroundLoop')) return;
    if (!musicPlayer) {
      const definition = soundRegistry.backgroundLoop;
      musicPlayer = createAudioPlayer(definition.source);
      musicPlayer.volume = definition.volume;
      musicPlayer.loop = true;
    }
    musicPlayer.play();
  },
  stopMusic: async () => {
    musicPlayer?.pause();
  },
  syncMusicWithSettings: async () => {
    if (useSettingsStore.getState().musicEnabled) await audioService.startMusic();
    else await audioService.stopMusic();
  },
  setActive: async (active: boolean) => {
    await setIsAudioActiveAsync(active);
    if (active) await audioService.syncMusicWithSettings();
  },
  release: () => {
    effectPlayers.forEach((player) => player.remove());
    effectPlayers.clear();
    musicPlayer?.remove();
    musicPlayer = undefined;
    initialized = false;
  },
  buttonClick: async () => audioService.play('tap'),
  arrowMove: async () => audioService.play('arrowMove'),
  blockedArrow: async () => audioService.play('arrowBlocked'),
  success: async () => audioService.play('arrowMove'),
  levelComplete: async () => audioService.play('levelComplete'),
  gameOver: async () => audioService.play('gameOver'),
  backgroundMusic: async () => audioService.startMusic(),
};
