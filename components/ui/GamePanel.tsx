import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from './Text';

type Props = {
  children: ReactNode;
  title?: string;
  eyebrow?: string;
  accent?: string;
  style?: StyleProp<ViewStyle>;
};

export const GamePanel = ({ children, title, eyebrow, accent = '#38BDF8', style }: Props) => (
  <View style={[styles.panel, { borderColor: accent }, style]}>
    <View style={[styles.glow, { backgroundColor: accent }]} />
    {eyebrow ? <Text variant="caption" color={accent}>{eyebrow}</Text> : null}
    {title ? <Text variant="heading2">{title}</Text> : null}
    {children}
  </View>
);

export const BadgeTile = ({ icon, label, value, accent = '#38BDF8', style }: { icon: string; label: string; value: string | number; accent?: string; style?: StyleProp<ViewStyle> }) => (
  <View style={[styles.badge, { borderColor: `${accent}66` }, style]}>
    <Text variant="heading2" align="center" color={accent}>{icon}</Text>
    <Text variant="caption" align="center" color="#B7C7D9">{label}</Text>
    <Text variant="title" align="center">{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  panel: {
    position: 'relative',
    gap: 12,
    padding: 18,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(7, 18, 48, 0.84)',
  },
  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    right: -76,
    top: -92,
    opacity: 0.18,
    borderRadius: 80,
  },
  badge: {
    width: '47%',
    minHeight: 104,
    gap: 5,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
