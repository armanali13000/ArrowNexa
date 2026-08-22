import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { STORAGE_KEYS } from '../storage/keys';
import { useProgressStore } from '../../store/progress/progressStore';

const CHANNEL_ID = 'game-reminders';
const SCHEDULE_COUNT = 8;

const reminderMessages = [
  { title: 'Your arrows are waiting', body: 'A fresh ArrowNexa puzzle is ready. Clear one board and keep the streak alive.' },
  { title: 'Can you find the clear path?', body: 'One smart move can open the whole board. Come solve the next route.' },
  { title: 'Quick puzzle break?', body: 'A few arrows, one clean escape, and your progress keeps moving.' },
  { title: 'The board changed again', body: 'New paths are waiting. Open ArrowNexa and guide the arrows out.' },
  { title: 'Your next escape is ready', body: 'Return to ArrowNexa and see if you can clear the level without mistakes.' },
  { title: 'A clean route is hiding', body: 'Take a minute, spot the open path, and continue your level journey.' },
  { title: 'ArrowNexa reminder', body: 'Your next puzzle is ready whenever you are.' },
  { title: 'Keep your run alive', body: 'One more level can unlock more rewards, hints, and progress.' },
];

type ScheduleState = {
  messageCursor: number;
  notificationIds: string[];
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const loadScheduleState = async (): Promise<ScheduleState> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.notificationSchedule);
  if (!raw) return { messageCursor: 0, notificationIds: [] };
  return { messageCursor: 0, notificationIds: [], ...JSON.parse(raw) };
};

const saveScheduleState = async (state: ScheduleState) => {
  await AsyncStorage.setItem(STORAGE_KEYS.notificationSchedule, JSON.stringify(state));
};

const ensureChannel = async () => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Game reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 220, 160, 220],
    lightColor: '#159BE8',
  });
};

const requestPermission = async () => {
  await ensureChannel();
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
};

const cancelStoredNotifications = async () => {
  const state = await loadScheduleState();
  await Promise.all(state.notificationIds.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)));
  await saveScheduleState({ ...state, notificationIds: [] });
};

const scheduleReminderQueue = async () => {
  const state = await loadScheduleState();
  const preferences = useProgressStore.getState().notificationPreferences;
  const intervalSeconds = Math.max(4, Math.min(12, preferences.reminderIntervalHours || 5)) * 60 * 60;
  let delaySeconds = 0;
  const notificationIds: string[] = [];

  for (let index = 0; index < SCHEDULE_COUNT; index += 1) {
    delaySeconds += intervalSeconds + (index % 2 === 0 ? 0 : 30 * 60);
    const message = reminderMessages[(state.messageCursor + index) % reminderMessages.length];
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        sound: true,
        data: { url: '/game' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: delaySeconds,
        channelId: CHANNEL_ID,
      },
    });
    notificationIds.push(id);
  }

  await saveScheduleState({
    messageCursor: (state.messageCursor + SCHEDULE_COUNT) % reminderMessages.length,
    notificationIds,
  });
};

export const reminderService = {
  requestPermissionOnFirstLaunch: async () => {
    const alreadyPrompted = await AsyncStorage.getItem(STORAGE_KEYS.notificationPermissionPrompted);
    if (alreadyPrompted) return;
    await AsyncStorage.setItem(STORAGE_KEYS.notificationPermissionPrompted, 'true');
    const granted = await requestPermission();
    await useProgressStore.getState().updateNotificationPreferences(granted
      ? { enabled: true, dailyChallengeReminder: true, dailyRewardReminder: true, reminderIntervalHours: 5 }
      : { enabled: false, dailyChallengeReminder: false, dailyRewardReminder: false });
    if (granted) await scheduleReminderQueue();
  },
  syncFromPreferences: async () => {
    const preferences = useProgressStore.getState().notificationPreferences;
    await cancelStoredNotifications();
    if (!preferences.enabled || (!preferences.dailyChallengeReminder && !preferences.dailyRewardReminder)) return false;
    const granted = await requestPermission();
    if (!granted) return false;
    await scheduleReminderQueue();
    return true;
  },
  disable: async () => {
    await cancelStoredNotifications();
  },
  handleNotificationTap: () => {
    const redirect = (notification?: Notifications.Notification) => {
      const url = notification?.request.content.data?.url;
      router.push(typeof url === 'string' ? url : '/game');
      reminderService.syncFromPreferences().catch(() => undefined);
    };

    const response = Notifications.getLastNotificationResponse();
    if (response?.notification) redirect(response.notification);

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      redirect(response.notification);
    });
    return () => subscription.remove();
  },
};
