import { setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';
import { useSettingsStore } from '../../store/settings/settingsStore';

export const audioService = {
  initialize: async () => {
    await setAudioModeAsync({ playsInSilentMode: false });
    await setIsAudioActiveAsync(true);
  },
  buttonClick: async () => {
    if (!useSettingsStore.getState().soundEnabled) return;
  },
  arrowMove: async () => {
    if (!useSettingsStore.getState().soundEnabled) return;
  },
  blockedArrow: async () => {
    if (!useSettingsStore.getState().soundEnabled) return;
  },
  success: async () => {
    if (!useSettingsStore.getState().soundEnabled) return;
  },
  levelComplete: async () => {
    if (!useSettingsStore.getState().soundEnabled) return;
  },
  gameOver: async () => {
    if (!useSettingsStore.getState().soundEnabled) return;
  },
  backgroundMusic: async () => {
    if (!useSettingsStore.getState().musicEnabled) return;
  },
};
