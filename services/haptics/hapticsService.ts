import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';
import { useSettingsStore } from '../../store/settings/settingsStore';

const fallbackVibrate = (pattern: number | number[]) => {
  if (Platform.OS === 'android') Vibration.vibrate(pattern);
};

const run = async (effect: () => Promise<void>, fallback: number | number[] = 18) => {
  if (!useSettingsStore.getState().hapticsEnabled) return;
  try {
    await effect();
  } catch (error) {
    console.error('[HapticsManager] Expo haptic failed, using vibration fallback', error);
    fallbackVibrate(fallback);
  }
};

export const hapticsService = {
  tap: () => run(() => Haptics.selectionAsync(), 12),
  button: () => run(() => Haptics.selectionAsync(), 12),
  hint: () => run(() => Haptics.selectionAsync(), 16),
  undo: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 18),
  booster: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 28),
  arrowSuccess: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 18),
  blocked: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error), [0, 35, 35, 55]),
  lifeLost: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning), [0, 45, 35, 45]),
  rankUp: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), [0, 25, 35, 25]),
  chapterComplete: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), [0, 25, 35, 25]),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), [0, 25, 35, 25]),
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error), [0, 35, 35, 55]),
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning), [0, 45, 35, 45]),
  levelComplete: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), [0, 25, 35, 25]),
};
