import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';

type Props = {
  size?: number;
};

export const BrandLogo = ({ size = 92 }: Props) => {
  const theme = useTheme();
  return (
    <View accessible accessibilityLabel="ArrowNexa logo">
      <Svg width={size} height={size} viewBox="0 0 96 96">
        <Circle cx="48" cy="48" r="43" fill={theme.colors.surface} />
        <Circle cx="48" cy="48" r="39" fill={theme.colors.boardBackground} />
        <Path
          d="M25 66V30l46 36V30"
          fill="none"
          stroke={theme.colors.primary}
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path d="M65 30h14v14" fill="none" stroke={theme.colors.secondary} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M25 66h16v-16" fill="none" stroke={theme.colors.accent} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
};
