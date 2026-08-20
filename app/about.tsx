import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppBackground } from '../components/layout/AppBackground';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { BrandLogo } from '../components/ui/BrandLogo';
import { Button } from '../components/ui/Button';
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
          <Text variant="bodySmall" color={theme.colors.textSecondary}>1.0.0 Phase 1 foundation</Text>
          <Button title="Privacy Policy  Placeholder" variant="tool" disabled />
          <Button title="Terms  Placeholder" variant="tool" disabled />
          <Button title="Contact  Placeholder" variant="tool" disabled />
          <Button title="Store Rating  Placeholder" variant="tool" disabled />
          <Button title="Share Game  Placeholder" variant="tool" disabled />
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
