import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppBackground } from '../components/layout/AppBackground';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { BrandLogo } from '../components/ui/BrandLogo';
import { Card } from '../components/ui/Card';
import { Text } from '../components/ui/Text';
import { useTheme } from '../hooks/useTheme';
import { useAppCopy } from '../hooks/useAppCopy';

export default function AboutScreen() {
  const theme = useTheme();
  const { copy, t } = useAppCopy();
  return (
    <AppBackground>
      <ScreenHeader title={copy.about} subtitle="Armanix Apps" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.hero}>
          <BrandLogo size={112} />
          <Text variant="display" align="center">ArrowNexa</Text>
          <Text variant="title" color={theme.colors.textSecondary} align="center">{copy.homeSubtitle}</Text>
          <Text variant="body" align="center">Armanix Apps</Text>
          <Text variant="bodySmall" color={theme.colors.textSecondary} align="center">{t('Developed by Arman')}</Text>
        </Card>
        <Card style={styles.stack}>
          <Text variant="heading2">{t('Version')}</Text>
          <Text variant="bodySmall" color={theme.colors.textSecondary}>{t('1.0.0 release candidate')}</Text>
        </Card>
        <Card style={styles.stack}>
          <Text variant="heading2">{t('Privacy')}</Text>
          <Text variant="bodySmall" color={theme.colors.textSecondary}>{t('ArrowNexa stores gameplay progress, settings, achievements, rewards, notification preferences, and reminder schedules locally on this device.')}</Text>
          <Text variant="bodySmall" color={theme.colors.textSecondary}>{t('No analytics SDK, account system, or cloud save is included in this build.')}</Text>
          <Text variant="bodySmall" color={theme.colors.textSecondary}>{t('Notification permission is optional. Reminders can be turned off in Settings at any time.')}</Text>
        </Card>
        <Card style={styles.stack}>
          <Text variant="heading2">{t('Terms')}</Text>
          <Text variant="bodySmall" color={theme.colors.textSecondary}>{t('ArrowNexa is provided as a puzzle game for personal entertainment. Progress is local to this installation unless a future cloud-save system is added.')}</Text>
        </Card>
        <Card style={styles.stack}>
          <Text variant="heading2">{t('Contact')}</Text>
          <Text variant="bodySmall" color={theme.colors.textSecondary}>Armanix Apps</Text>
          <Text variant="bodySmall" color={theme.colors.textSecondary}>{t('Developed by Arman')}</Text>
        </Card>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    gap: 14,
    paddingBottom: 34,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
  },
  stack: {
    gap: 12,
  },
});
