import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppBackground } from '../layout/AppBackground';
import { BrandLogo } from '../ui/BrandLogo';
import { PrimaryButton } from '../ui/Button';
import { Text } from '../ui/Text';
import { useTheme } from '../../hooks/useTheme';
import { getAppCopy, getLanguageChoice, languageChoices } from '../../services/i18n/appCopy';
import { useSettingsStore } from '../../store/settings/settingsStore';

export const LanguageOnboarding = () => {
  const theme = useTheme();
  const settings = useSettingsStore();
  const [selected, setSelected] = useState(settings.language);
  const [saving, setSaving] = useState(false);
  const copy = useMemo(() => getAppCopy(selected), [selected]);
  const selectedChoice = getLanguageChoice(selected);

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    await settings.updateSetting('language', selectedChoice.value);
    await settings.updateSetting('languageConfigured', true);
  };

  return (
    <AppBackground>
      <View style={styles.content}>
        <View style={styles.header}>
          <BrandLogo size={74} />
          <Text variant="heading1" align="center">{copy.chooseLanguageTitle}</Text>
          <Text variant="body" color={theme.colors.textSecondary} align="center">{copy.chooseLanguageBody}</Text>
        </View>
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {languageChoices.map((language) => {
            const active = selectedChoice.value === language.value;
            return (
              <Pressable
                key={language.value}
                accessibilityRole="button"
                onPress={() => setSelected(language.value)}
                style={({ pressed }) => [
                  styles.row,
                  { borderColor: active ? theme.colors.primary : theme.colors.divider, backgroundColor: active ? theme.colors.surface : theme.colors.card, opacity: pressed ? 0.72 : 1 },
                ]}
              >
                <View style={styles.rowCopy}>
                  <Text variant="title">{language.nativeLabel}</Text>
                  <Text variant="caption" color={theme.colors.textSecondary}>{language.label}</Text>
                </View>
                <Text variant="title" color={active ? theme.colors.primary : theme.colors.textSecondary}>{active ? copy.selected : ''}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <PrimaryButton title={copy.done} loading={saving} onPress={finish} />
      </View>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 22,
    paddingTop: 54,
    gap: 18,
  },
  header: {
    alignItems: 'center',
    gap: 10,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 9,
    paddingBottom: 8,
  },
  row: {
    minHeight: 62,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowCopy: {
    flex: 1,
    paddingRight: 10,
  },
});
