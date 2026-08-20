import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppBackground } from '../components/layout/AppBackground';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { BrandLogo } from '../components/ui/BrandLogo';
import { Card } from '../components/ui/Card';
import { Text } from '../components/ui/Text';
import { useTheme } from '../hooks/useTheme';

export default function AboutScreen() {
  const theme = useTheme();
  return (
    <AppBackground>
      <ScreenHeader title="About" subtitle="Armanix Studio" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.hero}>
          <BrandLogo size={112} />
          <Text variant="display" align="center">ArrowNexa</Text>
          <Text variant="title" color={theme.colors.textSecondary} align="center">Find the Way Out</Text>
          <Text variant="body" align="center">Developer: Armanix Studio</Text>
        </Card>
        <Card style={styles.stack}>
          <Text variant="heading2">Version</Text>
          <Text variant="bodySmall" color={theme.colors.textSecondary}>1.0.0 release candidate</Text>
        </Card>
        <Card style={styles.stack}>
          <Text variant="heading2">Privacy</Text>
          <Text variant="bodySmall" color={theme.colors.textSecondary}>ArrowNexa stores gameplay progress, settings, achievements, and rewards locally on this device. No analytics SDK is installed.</Text>
          <Text variant="bodySmall" color={theme.colors.textSecondary}>Advertising architecture is prepared but disabled until a production ad SDK and policy review are completed.</Text>
        </Card>
        <Card style={styles.stack}>
          <Text variant="heading2">Terms</Text>
          <Text variant="bodySmall" color={theme.colors.textSecondary}>ArrowNexa is provided as a puzzle game for personal entertainment. Progress is local to this installation unless a future cloud-save system is added.</Text>
        </Card>
        <Card style={styles.stack}>
          <Text variant="heading2">Contact</Text>
          <Text variant="bodySmall" color={theme.colors.textSecondary}>Developer: Armanix Studio</Text>
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
