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
import { audioService } from '../services/audio/audioService';
import { reminderService } from '../services/notifications/reminderService';
import { useProgressStore } from '../store/progress/progressStore';
import { useSettingsStore } from '../store/settings/settingsStore';

const languageOptions = [
  'English',
  'Hindi',
  'Urdu',
  'Spanish',
  'French',
  'German',
  'Portuguese',
  'Arabic',
  'Chinese',
  'Japanese',
  'Korean',
  'Russian',
];

export default function SettingsScreen() {
  const theme = useTheme();
  const [confirmReset, setConfirmReset] = useState(false);
  const settings = useSettingsStore();
  const resetProgress = useProgressStore((state) => state.resetProgress);
  const notifications = useProgressStore((state) => state.notificationPreferences);
  const updateNotificationPreferences = useProgressStore((state) => state.updateNotificationPreferences);
  const updateNotifications = async (next: Partial<typeof notifications>) => {
    await updateNotificationPreferences(next);
    await reminderService.syncFromPreferences();
  };

  return (
    <AppBackground>
      <ScreenHeader title="Settings" subtitle={`Language: ${settings.language}`} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="Audio">
          <ToggleRow title="Music" enabled={settings.musicEnabled} onToggle={async () => { await settings.updateSetting('musicEnabled', !settings.musicEnabled); await audioService.syncMusicWithSettings(); }} />
          <ToggleRow title="Sound Effects" enabled={settings.soundEnabled} onToggle={() => settings.updateSetting('soundEnabled', !settings.soundEnabled)} />
          <VolumePicker title="Music Volume" value={settings.musicVolume} onChange={async (value) => { await settings.updateSetting('musicVolume', value); audioService.refreshVolumes(); }} />
          <VolumePicker title="Sound Volume" value={settings.soundVolume} onChange={async (value) => { await settings.updateSetting('soundVolume', value); audioService.refreshVolumes(); }} />
          <View style={styles.actions}>
            <Button title="Test Sound" variant="tool" onPress={() => audioService.play('levelComplete')} />
            <Button title="Restart Music" variant="tool" onPress={() => audioService.startMusic('menuMusic')} />
          </View>
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
          <LanguagePicker value={settings.language} onChange={(language) => settings.updateSetting('language', language)} />
          <Button title="Privacy Policy" variant="tool" onPress={() => router.push('/about')} />
          <Button title="Terms and Conditions" variant="tool" onPress={() => router.push('/about')} />
          <Button title="About" variant="tool" onPress={() => router.push('/about')} />
          <Button title="Restore Settings Defaults" variant="tool" onPress={async () => {
            await settings.updateSetting('musicEnabled', true);
            await settings.updateSetting('soundEnabled', true);
            await settings.updateSetting('musicVolume', 1);
            await settings.updateSetting('soundVolume', 1);
            await settings.updateSetting('hapticsEnabled', true);
            await settings.updateSetting('animationsEnabled', true);
            await settings.updateSetting('themeMode', 'system');
            await settings.updateSetting('language', 'English');
            await audioService.syncMusicWithSettings();
          }} />
          <Button title="Reset Progress" variant="ghost" onPress={() => setConfirmReset(true)} />
        </Section>
        <Section title="Notifications">
          <Text variant="bodySmall" color={theme.colors.textSecondary}>Reminders are scheduled on this device and rotate messages so the same alert is not repeated.</Text>
          <ToggleRow
            title="Notifications"
            enabled={notifications.enabled}
            onToggle={() => updateNotifications(notifications.enabled
              ? { enabled: false, dailyChallengeReminder: false, dailyRewardReminder: false }
              : { enabled: true, dailyChallengeReminder: true, dailyRewardReminder: true })}
          />
          <ToggleRow title="Daily Challenge Reminder" enabled={notifications.enabled && notifications.dailyChallengeReminder} onToggle={() => updateNotifications({ dailyChallengeReminder: !notifications.dailyChallengeReminder })} disabled={!notifications.enabled} />
          <ToggleRow title="Daily Reward Reminder" enabled={notifications.enabled && notifications.dailyRewardReminder} onToggle={() => updateNotifications({ dailyRewardReminder: !notifications.dailyRewardReminder })} disabled={!notifications.enabled} />
          <ReminderIntervalPicker value={notifications.reminderIntervalHours} disabled={!notifications.enabled} onChange={(reminderIntervalHours) => updateNotifications({ reminderIntervalHours })} />
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

const VolumePicker = ({ title, value, onChange }: { title: string; value: number; onChange: (value: number) => void }) => {
  const theme = useTheme();
  const options = [
    { label: '50%', value: 0.5 },
    { label: '75%', value: 0.75 },
    { label: '100%', value: 1 },
  ];
  return (
    <View style={styles.volumeGroup}>
      <Text variant="body">{title}</Text>
      <View style={styles.segment}>
        {options.map((option) => (
          <Button
            key={option.label}
            title={option.label}
            variant={Math.abs(value - option.value) < 0.01 ? 'primary' : 'tool'}
            onPress={() => onChange(option.value)}
            style={styles.segmentButton}
            accessibilityLabel={`${title} ${option.label}`}
          />
        ))}
      </View>
      <Text variant="caption" color={theme.colors.textSecondary}>{Math.round(value * 100)}%</Text>
    </View>
  );
};

const LanguagePicker = ({ value, onChange }: { value: string; onChange: (language: string) => void }) => (
  <View style={styles.volumeGroup}>
    <Text variant="body">Language</Text>
    <View style={styles.languageGrid}>
      {languageOptions.map((language) => (
        <Button
          key={language}
          title={language}
          variant={value === language ? 'primary' : 'tool'}
          onPress={() => onChange(language)}
          style={styles.languageChip}
        />
      ))}
    </View>
    <Text variant="caption">Selected: {value}</Text>
  </View>
);

const ReminderIntervalPicker = ({ value, disabled, onChange }: { value: number; disabled?: boolean; onChange: (hour: number) => void }) => {
  const options = [
    { label: '4h', value: 4 },
    { label: '5h', value: 5 },
    { label: '6h', value: 6 },
  ];
  return (
    <View style={[styles.volumeGroup, { opacity: disabled ? 0.45 : 1 }]}>
      <Text variant="body">Reminder Interval</Text>
      <View style={styles.segment}>
        {options.map((option) => (
          <Button
            key={option.label}
            title={option.label}
            variant={value === option.value ? 'primary' : 'tool'}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={styles.segmentButton}
          />
        ))}
      </View>
    </View>
  );
};

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
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageChip: {
    minWidth: '30%',
    flexGrow: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  volumeGroup: {
    gap: 8,
  },
  modalStack: {
    gap: 14,
  },
});
