import { create } from 'zustand';
import { SettingsData, defaultSettings, loadSettings, saveSettings } from '../../services/storage/settingsStorage';

type SettingsState = SettingsData & {
  loaded: boolean;
  hydrate: () => Promise<void>;
  updateSetting: <Key extends keyof SettingsData>(key: Key, value: SettingsData[Key]) => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaultSettings,
  loaded: false,
  hydrate: async () => {
    const settings = await loadSettings();
    set({ ...settings, loaded: true });
  },
  updateSetting: async (key, value) => {
    const next = { ...get(), [key]: value, loaded: true };
    const settings: SettingsData = {
      version: 1,
      musicEnabled: next.musicEnabled,
      soundEnabled: next.soundEnabled,
      hapticsEnabled: next.hapticsEnabled,
      animationsEnabled: next.animationsEnabled,
      themeMode: next.themeMode,
      language: next.language,
    };
    set(settings);
    await saveSettings(settings);
  },
}));
