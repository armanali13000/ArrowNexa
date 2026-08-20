import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../../store/settings/settingsStore';

const run = async (effect: () => Promise<void>) => {
  if (!useSettingsStore.getState().hapticsEnabled) return;
  await effect();
};

export const hapticsService = {
  tap: () => run(() => Haptics.selectionAsync()),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  levelComplete: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
};
