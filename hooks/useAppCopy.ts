import { getAppCopy, getUiText } from '../services/i18n/appCopy';
import { useSettingsStore } from '../store/settings/settingsStore';

export const useAppCopy = () => {
  const language = useSettingsStore((state) => state.language);
  const copy = getAppCopy(language);
  return {
    language,
    copy,
    t: (text: string) => getUiText(language, text),
  };
};
