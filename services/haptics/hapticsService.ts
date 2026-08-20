import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../../store/settings/settingsStore';

const run = async (effect: () => Promise<void>) => {
  if (!useSettingsStore.getState().hapticsEnabled) return;
  await effect();
};

export const hapticsService = {
  tap: () => run(() => Haptics.selectionAsync()),
  button: () => run(() => Haptics.selectionAsync()),
  hint: () => run(() => Haptics.selectionAsync()),
  undo: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  booster: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  arrowSuccess: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  blocked: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  lifeLost: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  rankUp: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  chapterComplete: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  levelComplete: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
};
