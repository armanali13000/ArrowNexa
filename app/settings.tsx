import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppBackground } from '../components/layout/AppBackground';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { AppModal } from '../components/ui/AppModal';
import { Button, PrimaryButton } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Text } from '../components/ui/Text';
import { ToggleRow } from '../components/ui/ToggleRow';
import { useTheme } from '../hooks/useTheme';
import { useProgressStore } from '../store/progress/progressStore';
import { useSettingsStore } from '../store/settings/settingsStore';

export default function SettingsScreen() {
  const theme = useTheme();
  const [confirmReset, setConfirmReset] = useState(false);
  const settings = useSettingsStore();
  const resetProgress = useProgressStore((state) => state.resetProgress);
  const notifications = useProgressStore((state) => state.notificationPreferences);
  const updateNotificationPreferences = useProgressStore((state) => state.updateNotificationPreferences);

  return (
    <AppBackground>
      <ScreenHeader title="Settings" subtitle="Preferences persist locally" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="Audio">
          <ToggleRow title="Music" enabled={settings.musicEnabled} onToggle={() => settings.updateSetting('musicEnabled', !settings.musicEnabled)} />
          <ToggleRow title="Sound Effects" enabled={settings.soundEnabled} onToggle={() => settings.updateSetting('soundEnabled', !settings.soundEnabled)} />
        </Section>
        <Section title="Gameplay">
          <ToggleRow title="Haptics" enabled={settings.hapticsEnabled} onToggle={() => settings.updateSetting('hapticsEnabled', !settings.hapticsEnabled)} />
          <ToggleRow title="Animations" enabled={settings.animationsEnabled} onToggle={() => settings.updateSetting('animationsEnabled', !settings.animationsEnabled)} />
        </Section>
        <Section title="Appearance">
          <View style={styles.segment}>
            {(['light', 'dark', 'system'] as const).map((mode) => (
              <Button
                key={mode}
                title={mode === 'system' ? 'System' : mode === 'dark' ? 'Dark' : 'Light'}
                variant={settings.themeMode === mode ? 'primary' : 'tool'}
                onPress={() => settings.updateSetting('themeMode', mode)}
                style={styles.segmentButton}
              />
            ))}
          </View>
        </Section>
        <Section title="Other">
          <Text variant="body">Language</Text>
          <Text variant="bodySmall" color={theme.colors.textSecondary}>English is the Phase 1 placeholder.</Text>
          <Button title="Privacy Policy" variant="tool" onPress={() => router.push('/about')} />
          <Button title="Terms and Conditions" variant="tool" onPress={() => router.push('/about')} />
          <Button title="About" variant="tool" onPress={() => router.push('/about')} />
          <Button title="Reset Progress" variant="ghost" onPress={() => setConfirmReset(true)} />
        </Section>
        <Section title="Notifications">
          <Text variant="bodySmall" color={theme.colors.textSecondary}>Reminders are off by default and stay local. Permission is requested only when scheduling is added and enabled.</Text>
          <ToggleRow title="Notifications" enabled={notifications.enabled} onToggle={() => updateNotificationPreferences({ enabled: !notifications.enabled })} />
          <ToggleRow title="Daily Challenge Reminder" enabled={notifications.enabled && notifications.dailyChallengeReminder} onToggle={() => updateNotificationPreferences({ dailyChallengeReminder: !notifications.dailyChallengeReminder })} disabled={!notifications.enabled} />
          <ToggleRow title="Daily Reward Reminder" enabled={notifications.enabled && notifications.dailyRewardReminder} onToggle={() => updateNotificationPreferences({ dailyRewardReminder: !notifications.dailyRewardReminder })} disabled={!notifications.enabled} />
          <Text variant="caption" color={theme.colors.textSecondary}>Default reminder time: 7:00 PM</Text>
        </Section>
      </ScrollView>
      <AppModal visible={confirmReset} onClose={() => setConfirmReset(false)}>
        <View style={styles.modalStack}>
          <Text variant="heading2" align="center">Reset Progress?</Text>
          <Text variant="body" color={theme.colors.textSecondary} align="center">This clears levels, achievements, statistics, hints, and streaks. Settings stay unchanged.</Text>
          <PrimaryButton title="Cancel" onPress={() => setConfirmReset(false)} />
          <Button title="Reset Everything" variant="ghost" onPress={async () => { await resetProgress(); setConfirmReset(false); }} />
        </View>
      </AppModal>
    </AppBackground>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card style={styles.section}>
    <Text variant="heading2">{title}</Text>
    {children}
  </Card>
);

const styles = StyleSheet.create({
  content: {
    padding: 18,
    gap: 14,
    paddingBottom: 34,
  },
  section: {
    gap: 12,
  },
  segment: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentButton: {
    flex: 1,
  },
  modalStack: {
    gap: 14,
  },
});
