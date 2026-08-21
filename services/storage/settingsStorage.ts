import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './keys';
import { ThemeMode } from '../../constants/theme';

export type SettingsData = {
  version: 1;
  musicEnabled: boolean;
  soundEnabled: boolean;
  musicVolume: number;
  soundVolume: number;
  hapticsEnabled: boolean;
  animationsEnabled: boolean;
  themeMode: ThemeMode;
  language: string;
};

export const defaultSettings: SettingsData = {
  version: 1,
  musicEnabled: true,
  soundEnabled: true,
  musicVolume: 1,
  soundVolume: 1,
  hapticsEnabled: true,
  animationsEnabled: true,
  themeMode: 'system',
  language: 'English',
};

export const loadSettings = async (): Promise<SettingsData> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.settings);
  if (!raw) return defaultSettings;
  return { ...defaultSettings, ...JSON.parse(raw) };
};

export const saveSettings = async (settings: SettingsData) => {
  await AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
};
