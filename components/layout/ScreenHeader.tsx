import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { ArrowBackIcon } from '../ui/Icons';
import { IconButton } from '../ui/IconButton';
import { Text } from '../ui/Text';

export const ScreenHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  const theme = useTheme();
  return (
    <View style={styles.header}>
      <IconButton label="Go back" icon={<ArrowBackIcon color={theme.colors.textPrimary} />} onPress={() => router.back()} />
      <View style={styles.copy}>
        <Text variant="heading2" numberOfLines={1}>{title}</Text>
        {subtitle ? <Text variant="caption" color={theme.colors.textSecondary} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
  },
  copy: {
    flex: 1,
  },
});
