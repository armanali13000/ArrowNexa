import React, { ReactNode } from 'react';
import { StyleProp, Text as RNText, TextStyle } from 'react-native';
import { Theme } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

type Variant = keyof Theme['typography'];

type Props = {
  children: ReactNode;
  variant?: Variant;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

export const Text = ({ children, variant = 'body', color, align, style, numberOfLines }: Props) => {
  const theme = useTheme();
  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[theme.typography[variant], { color: color ?? theme.colors.textPrimary, textAlign: align }, style]}
      allowFontScaling
    >
      {children}
    </RNText>
  );
};
