import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconProps = { size?: number; color: string };

export const ArrowBackIcon = ({ size = 22, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M15 5l-7 7 7 7" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></Svg>
);

export const PauseIcon = ({ size = 22, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24"><Rect x="6" y="5" width="4" height="14" rx="2" fill={color} /><Rect x="14" y="5" width="4" height="14" rx="2" fill={color} /></Svg>
);

export const GearIcon = ({ size = 22, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24"><Circle cx="12" cy="12" r="3" fill="none" stroke={color} strokeWidth="2" /><Path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" stroke={color} strokeWidth="2" strokeLinecap="round" /></Svg>
);

export const StarIcon = ({ size = 18, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3z" fill={color} /></Svg>
);

export const BoltIcon = ({ size = 20, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M13 2 4 14h7l-1 8 10-13h-7l0-7z" fill={color} /></Svg>
);

export const LockIcon = ({ size = 18, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24"><Rect x="5" y="10" width="14" height="10" rx="3" fill="none" stroke={color} strokeWidth="2" /><Path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" /></Svg>
);

export const HeartIcon = ({ size = 18, color, filled = true }: IconProps & { filled?: boolean }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M12 20.5s-7.5-4.4-9.4-9A5.2 5.2 0 0 1 12 6a5.2 5.2 0 0 1 9.4 5.5c-1.9 4.6-9.4 9-9.4 9z"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
