import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const Card = ({ children, style }: Props) => {
  const theme = useTheme();
  return <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.divider }, theme.shadow, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
  },
});
