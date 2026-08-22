import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppBackground } from '../components/layout/AppBackground';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { AppModal } from '../components/ui/AppModal';
import { Button, PrimaryButton } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Text } from '../components/ui/Text';
import { ToggleRow } from '../components/ui/ToggleRow';
import { useTheme } from '../hooks/useTheme';
import { audioService } from '../services/audio/audioService';
import { getAppCopy, getLanguageChoice, languageChoices } from '../services/i18n/appCopy';
import { reminderService } from '../services/notifications/reminderService';
import { useProgressStore } from '../store/progress/progressStore';
import { useSettingsStore } from '../store/settings/settingsStore';

export default function SettingsScreen() {
  const theme = useTheme();
  const [confirmReset, setConfirmReset] = useState(false);
  const settings = useSettingsStore();
  const resetProgress = useProgressStore((state) => state.resetProgress);
  const notifications = useProgressStore((state) => state.notificationPreferences);
  const updateNotificationPreferences = useProgressStore((state) => state.updateNotificationPreferences);
  const copy = getAppCopy(settings.language);
  const updateNotifications = async (next: Partial<typeof notifications>) => {
    await updateNotificationPreferences(next);
    await reminderService.syncFromPreferences();
  };

  return (
    <AppBackground>
      <ScreenHeader title={copy.settings} subtitle={`${copy.languageLine}: ${settings.language}`} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title={copy.audio}>
          <ToggleRow title={copy.music} enabled={settings.musicEnabled} onToggle={async () => { await settings.updateSetting('musicEnabled', !settings.musicEnabled); await audioService.syncMusicWithSettings(); }} />
          <ToggleRow title={copy.soundEffects} enabled={settings.soundEnabled} onToggle={() => settings.updateSetting('soundEnabled', !settings.soundEnabled)} />
          <VolumePicker title={copy.musicVolume} value={settings.musicVolume} onChange={async (value) => { await settings.updateSetting('musicVolume', value); audioService.refreshVolumes(); }} />
          <VolumePicker title={copy.soundVolume} value={settings.soundVolume} onChange={async (value) => { await settings.updateSetting('soundVolume', value); audioService.refreshVolumes(); }} />
          <View style={styles.actions}>
            <Button title={copy.testSound} variant="tool" onPress={() => audioService.play('levelComplete')} />
            <Button title={copy.restartMusic} variant="tool" onPress={() => audioService.startMusic('menuMusic')} />
          </View>
        </Section>
        <Section title={copy.gameplay}>
          <ToggleRow title={copy.haptics} enabled={settings.hapticsEnabled} onToggle={() => settings.updateSetting('hapticsEnabled', !settings.hapticsEnabled)} />
          <ToggleRow title={copy.animations} enabled={settings.animationsEnabled} onToggle={() => settings.updateSetting('animationsEnabled', !settings.animationsEnabled)} />
        </Section>
        <Section title={copy.appearance}>
          <View style={styles.segment}>
            {(['light', 'dark', 'system'] as const).map((mode) => (
              <Button
                key={mode}
                title={mode === 'system' ? copy.system : mode === 'dark' ? copy.dark : copy.light}
                variant={settings.themeMode === mode ? 'primary' : 'tool'}
                onPress={() => settings.updateSetting('themeMode', mode)}
                style={styles.segmentButton}
              />
            ))}
          </View>
        </Section>
        <Section title={copy.other}>
          <LanguagePicker copy={copy} value={settings.language} onChange={(language) => settings.updateSetting('language', language)} />
          <Button title={copy.privacyPolicy} variant="tool" onPress={() => router.push('/about')} />
          <Button title={copy.terms} variant="tool" onPress={() => router.push('/about')} />
          <Button title={copy.about} variant="tool" onPress={() => router.push('/about')} />
          <Button title={copy.restoreDefaults} variant="tool" onPress={async () => {
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
          <Button title={copy.resetProgress} variant="ghost" onPress={() => setConfirmReset(true)} />
        </Section>
        <Section title={copy.notifications}>
          <Text variant="bodySmall" color={theme.colors.textSecondary}>{copy.notificationBody}</Text>
          <ToggleRow
            title={copy.notifications}
            enabled={notifications.enabled}
            onToggle={() => updateNotifications(notifications.enabled
              ? { enabled: false, dailyChallengeReminder: false, dailyRewardReminder: false }
              : { enabled: true, dailyChallengeReminder: true, dailyRewardReminder: true })}
          />
          <ToggleRow title={copy.dailyChallengeReminder} enabled={notifications.enabled && notifications.dailyChallengeReminder} onToggle={() => updateNotifications({ dailyChallengeReminder: !notifications.dailyChallengeReminder })} disabled={!notifications.enabled} />
          <ToggleRow title={copy.dailyRewardReminder} enabled={notifications.enabled && notifications.dailyRewardReminder} onToggle={() => updateNotifications({ dailyRewardReminder: !notifications.dailyRewardReminder })} disabled={!notifications.enabled} />
          <ReminderIntervalPicker title={copy.reminderInterval} value={notifications.reminderIntervalHours} disabled={!notifications.enabled} onChange={(reminderIntervalHours) => updateNotifications({ reminderIntervalHours })} />
        </Section>
      </ScrollView>
      <AppModal visible={confirmReset} onClose={() => setConfirmReset(false)}>
        <View style={styles.modalStack}>
          <Text variant="heading2" align="center">{copy.resetTitle}</Text>
          <Text variant="body" color={theme.colors.textSecondary} align="center">{copy.resetBody}</Text>
          <PrimaryButton title={copy.cancel} onPress={() => setConfirmReset(false)} />
          <Button title={copy.resetEverything} variant="ghost" onPress={async () => { await resetProgress(); setConfirmReset(false); }} />
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

const LanguagePicker = ({ copy, value, onChange }: { copy: ReturnType<typeof getAppCopy>; value: string; onChange: (language: string) => void }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = getLanguageChoice(value);

  const choose = (language: string) => {
    onChange(language);
    setOpen(false);
  };

  return (
    <View style={styles.volumeGroup}>
      <Text variant="body">{copy.language}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.changeLanguage}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.selectRow, { borderColor: theme.colors.divider, backgroundColor: theme.colors.surface, opacity: pressed ? 0.75 : 1 }]}
      >
        <View>
          <Text variant="title">{selected.nativeLabel}</Text>
          <Text variant="caption" color={theme.colors.textSecondary}>{selected.label}</Text>
        </View>
        <Text variant="title" color={theme.colors.primary}>v</Text>
      </Pressable>
      <Text variant="caption">{copy.selected}: {selected.label}</Text>
      <AppModal visible={open} onClose={() => setOpen(false)}>
        <View style={styles.modalStack}>
          <Text variant="heading2" align="center">{copy.chooseLanguageTitle}</Text>
          <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
            {languageChoices.map((language) => (
              <Pressable
                key={language.value}
                accessibilityRole="button"
                onPress={() => choose(language.value)}
                style={({ pressed }) => [
                  styles.languageRow,
                  { borderColor: value === language.value ? theme.colors.primary : theme.colors.divider, backgroundColor: value === language.value ? theme.colors.surface : 'transparent', opacity: pressed ? 0.72 : 1 },
                ]}
              >
                <View style={styles.languageRowCopy}>
                  <Text variant="title">{language.nativeLabel}</Text>
                  <Text variant="caption" color={theme.colors.textSecondary}>{language.label}</Text>
                </View>
                {value === language.value ? <Text variant="caption" color={theme.colors.primary}>{copy.selected}</Text> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </AppModal>
    </View>
  );
};

const ReminderIntervalPicker = ({ title, value, disabled, onChange }: { title: string; value: number; disabled?: boolean; onChange: (hour: number) => void }) => {
  const options = [
    { label: '4h', value: 4 },
    { label: '5h', value: 5 },
    { label: '6h', value: 6 },
  ];
  return (
    <View style={[styles.volumeGroup, { opacity: disabled ? 0.45 : 1 }]}>
      <Text variant="body">{title}</Text>
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
  selectRow: { minHeight: 62, borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  languageList: { maxHeight: 420 },
  languageRow: { minHeight: 58, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  languageRowCopy: { flex: 1, paddingRight: 10 },
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
