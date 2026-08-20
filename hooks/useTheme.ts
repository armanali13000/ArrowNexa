import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from '../constants/theme';
import { useSettingsStore } from '../store/settings/settingsStore';

export const useTheme = () => {
  const scheme = useColorScheme();
  const themeMode = useSettingsStore((state) => state.themeMode);
  const resolved = themeMode === 'system' ? scheme : themeMode;
  return resolved === 'dark' ? darkTheme : lightTheme;
};
