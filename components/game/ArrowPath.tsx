import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { Theme } from '../../constants/theme';
import { createArrowHeadFillPath, createArrowSvgPath, getArrowStrokeWidth, getEscapeTranslation, getVisualDirectionFromPath } from '../../engine/geometry/rendering';
import { PuzzleArrow } from '../../engine/types/game';

type Props = {
  arrow: PuzzleArrow;
  boardSize: number;
  cellSize: number;
  boardPadding: number;
  theme: Theme;
  debug?: boolean;
  isHinted: boolean;
  onPress: (arrowId: string) => void;
  onEscapeComplete: (arrowId: string) => void;
  onRestoreComplete?: (arrowId: string) => void;
};

export const ArrowPath = memo(({ arrow, boardSize, cellSize, boardPadding, theme, debug, isHinted, onPress, onEscapeComplete, onRestoreComplete }: Props) => {
  const strokeWidth = getArrowStrokeWidth(cellSize);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const shake = useSharedValue(0);
  const pulse = useSharedValue(1);
  const escapeReportedRef = useRef(false);
  const restoreReportedRef = useRef(false);
  const visualDirection = getVisualDirectionFromPath(arrow.path, arrow.direction);

  const reportEscape = useCallback((arrowId: string) => {
    if (escapeReportedRef.current) return;
    escapeReportedRef.current = true;
    onEscapeComplete(arrowId);
  }, [onEscapeComplete]);

  const reportRestore = useCallback((arrowId: string) => {
    if (restoreReportedRef.current) return;
    restoreReportedRef.current = true;
    onRestoreComplete?.(arrowId);
  }, [onRestoreComplete]);

  const geometry = useMemo(
    () => ({
      shaftPath: createArrowSvgPath(arrow.path, cellSize, boardPadding),
      headPath: createArrowHeadFillPath(arrow.path, visualDirection, cellSize, boardPadding, strokeWidth),
      exit: getEscapeTranslation(arrow.path, visualDirection, cellSize, boardPadding, boardSize),
      label: arrow.path[0],
    }),
    [arrow.direction, arrow.path, boardPadding, boardSize, cellSize, strokeWidth, visualDirection],
  );

  useEffect(() => {
    if (arrow.state === 'moving') {
      escapeReportedRef.current = false;
      const travel = Math.abs(geometry.exit.x) + Math.abs(geometry.exit.y);
      const duration = Math.min(560, Math.max(360, travel * 0.9));
      pulse.value = withSequence(withTiming(1.02, { duration: 80 }), withTiming(1, { duration: 100 }));
      translateX.value = withTiming(geometry.exit.x, { duration, easing: Easing.out(Easing.quad) });
      translateY.value = withTiming(geometry.exit.y, { duration, easing: Easing.out(Easing.quad) });
      opacity.value = withTiming(1, { duration }, () => runOnJS(reportEscape)(arrow.id));
      return;
    }

    if (arrow.state === 'restoring') {
      restoreReportedRef.current = false;
      translateX.value = geometry.exit.x;
      translateY.value = geometry.exit.y;
      opacity.value = 0.28;
      translateX.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) });
      translateY.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) });
      opacity.value = withTiming(1, { duration: 220 }, () => runOnJS(reportRestore)(arrow.id));
      return;
    }

    if (arrow.state === 'normal') {
      translateX.value = withTiming(0, { duration: 90 });
      translateY.value = withTiming(0, { duration: 90 });
      opacity.value = withTiming(1, { duration: 90 });
      pulse.value = withTiming(1, { duration: 90 });
    }
  }, [arrow.id, arrow.state, geometry.exit.x, geometry.exit.y, opacity, pulse, reportEscape, reportRestore, translateX, translateY]);

  useEffect(() => {
    if (arrow.state === 'blocked') {
      shake.value = withSequence(
        withTiming(-5, { duration: 32 }),
        withTiming(5, { duration: 38 }),
        withTiming(-4, { duration: 36 }),
        withTiming(4, { duration: 34 }),
        withTiming(0, { duration: 36 }),
      );
    }
  }, [arrow.state, shake]);

  useEffect(() => {
    if (isHinted || arrow.state === 'hinted') {
      pulse.value = withSequence(withTiming(1.1, { duration: 170 }), withTiming(1, { duration: 170 }), withTiming(1.08, { duration: 170 }), withTiming(1, { duration: 170 }));
    }
  }, [arrow.state, isHinted, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value + shake.value }, { translateY: translateY.value }, { scale: pulse.value }],
  }));

  if (arrow.state === 'removed') return null;

  const color = arrow.state === 'blocked' ? '#E53935' : arrow.state === 'moving' ? '#0F76C8' : isHinted || arrow.state === 'hinted' ? theme.colors.accent : '#061344';
  const touchStrokeWidth = Math.max(22, cellSize * 0.76);
  const glow = isHinted || arrow.state === 'hinted';

  return (
    <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, animatedStyle]}>
      <Svg width={boardSize} height={boardSize} viewBox={`0 0 ${boardSize} ${boardSize}`} pointerEvents="box-none">
        <Path d={geometry.shaftPath} fill="none" stroke="transparent" strokeWidth={touchStrokeWidth} strokeLinecap="round" strokeLinejoin="round" onPress={() => onPress(arrow.id)} />
        <Path d={geometry.headPath} fill="transparent" stroke="transparent" strokeWidth={touchStrokeWidth * 0.5} strokeLinecap="round" strokeLinejoin="round" onPress={() => onPress(arrow.id)} />

        {glow ? <Path d={geometry.shaftPath} fill="none" stroke={color} strokeWidth={strokeWidth + 7} strokeLinecap="round" strokeLinejoin="round" opacity={0.12} /> : null}
        <Path d={geometry.shaftPath} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        <Path d={geometry.headPath} fill={color} stroke={color} strokeWidth={strokeWidth * 0.35} strokeLinecap="round" strokeLinejoin="round" onPress={() => onPress(arrow.id)} />

        {debug ? (
          <SvgText x={boardPadding + geometry.label.col * cellSize + 4} y={boardPadding + geometry.label.row * cellSize + 14} fill={theme.colors.secondary} fontSize="8">
            {arrow.id}
          </SvgText>
        ) : null}
      </Svg>
    </Animated.View>
  );
});

ArrowPath.displayName = 'ArrowPath';
