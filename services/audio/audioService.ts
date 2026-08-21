import { AudioPlayer, createAudioPlayer, setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';
import { useSettingsStore } from '../../store/settings/settingsStore';
import { SoundId, soundRegistry } from './soundRegistry';

const effectPlayers = new Map<SoundId, AudioPlayer>();
let musicPlayer: AudioPlayer | undefined;
let currentMusicId: Extract<SoundId, 'menuMusic' | 'gameplayMusic'> | undefined;
let initialized = false;

const sourceFor = (soundId: SoundId) => soundRegistry[soundId].source;

const hasSource = (soundId: SoundId) => Boolean(sourceFor(soundId));

const getEffectPlayer = (soundId: SoundId) => {
  const definition = soundRegistry[soundId];
  if (!definition || definition.category === 'music' || !hasSource(soundId)) return undefined;
  const cached = effectPlayers.get(soundId);
  if (cached) return cached;
  try {
    const player = createAudioPlayer(definition.source);
    player.volume = definition.volume;
    effectPlayers.set(soundId, player);
    return player;
  } catch (error) {
    console.error(`[AudioManager] Failed to create SFX player: ${soundId}`, error);
    return undefined;
  }
};

export const audioService = {
  initialize: async () => {
    if (initialized) return;
    initialized = true;
    try {
      await setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false, interruptionMode: 'mixWithOthers' });
      await setIsAudioActiveAsync(true);
    } catch (error) {
      console.error('[AudioManager] Failed to initialize audio', error);
    }
  },
  play: async (soundId: SoundId) => {
    if (!useSettingsStore.getState().soundEnabled) return;
    const player = getEffectPlayer(soundId);
    if (!player) return;
    try {
      await player.seekTo(0);
      player.play();
    } catch (error) {
      console.error(`[AudioManager] Failed to play SFX: ${soundId}`, error);
    }
  },
  startMusic: async (soundId: Extract<SoundId, 'menuMusic' | 'gameplayMusic'> = 'menuMusic') => {
    if (!useSettingsStore.getState().musicEnabled || !hasSource(soundId)) {
      await audioService.stopMusic();
      return;
    }
    if (!musicPlayer || currentMusicId !== soundId) {
      musicPlayer?.remove();
      try {
        const definition = soundRegistry[soundId];
        musicPlayer = createAudioPlayer(definition.source);
        musicPlayer.volume = definition.volume;
        musicPlayer.loop = true;
        currentMusicId = soundId;
      } catch (error) {
        console.error(`[AudioManager] Failed to create music player: ${soundId}`, error);
        return;
      }
    }
    try {
      musicPlayer.play();
    } catch (error) {
      console.error(`[AudioManager] Failed to play music: ${soundId}`, error);
    }
  },
  stopMusic: async () => {
    musicPlayer?.pause();
  },
  syncMusicWithSettings: async () => {
    if (useSettingsStore.getState().musicEnabled) await audioService.startMusic(currentMusicId ?? 'menuMusic');
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
    currentMusicId = undefined;
    initialized = false;
  },
  buttonClick: async () => audioService.play('tap'),
  arrowMove: async () => audioService.play('arrowMove'),
  blockedArrow: async () => audioService.play('arrowBlocked'),
  success: async () => audioService.play('arrowMove'),
  levelComplete: async () => audioService.play('levelComplete'),
  gameOver: async () => audioService.play('gameOver'),
  backgroundMusic: async () => audioService.startMusic('menuMusic'),
};
