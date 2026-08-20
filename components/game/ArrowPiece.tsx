import React, { memo, useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { Theme } from '../../constants/theme';
import { createArrowHeadPath, createArrowSvgPath, getEscapeTranslation } from '../../engine/geometry/rendering';
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
};

export const ArrowPiece = memo(({ arrow, boardSize, cellSize, boardPadding, theme, debug, isHinted, onPress, onEscapeComplete }: Props) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const shake = useSharedValue(0);
  const pulse = useSharedValue(1);

  const geometry = useMemo(
    () => ({
      linePath: createArrowSvgPath(arrow.path, cellSize, boardPadding),
      headPath: createArrowHeadPath(arrow.path, arrow.direction, cellSize, boardPadding),
      exit: getEscapeTranslation(arrow.path, arrow.direction, cellSize, boardPadding, boardSize),
      label: arrow.path[0],
    }),
    [arrow.direction, arrow.path, boardPadding, boardSize, cellSize],
  );

  useEffect(() => {
    if (arrow.state === 'moving') {
      const distance = Math.abs(geometry.exit.x) + Math.abs(geometry.exit.y);
      const duration = Math.min(450, Math.max(250, distance * 1.1));
      translateX.value = withTiming(geometry.exit.x, { duration });
      translateY.value = withTiming(geometry.exit.y, { duration });
      opacity.value = withTiming(0.1, { duration }, () => runOnJS(onEscapeComplete)(arrow.id));
    }
  }, [arrow.id, arrow.state, geometry.exit.x, geometry.exit.y, onEscapeComplete, opacity, translateX, translateY]);

  useEffect(() => {
    if (arrow.state === 'blocked') {
      shake.value = withSequence(withTiming(-5, { duration: 45 }), withTiming(5, { duration: 45 }), withTiming(-3, { duration: 45 }), withTiming(0, { duration: 45 }));
    }
  }, [arrow.state, shake]);

  useEffect(() => {
    if (isHinted || arrow.state === 'hinted') {
      pulse.value = withSequence(withTiming(1.12, { duration: 180 }), withTiming(1, { duration: 180 }), withTiming(1.1, { duration: 180 }), withTiming(1, { duration: 180 }));
    }
  }, [arrow.state, isHinted, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value + shake.value }, { translateY: translateY.value }, { scale: pulse.value }],
  }));

  if (arrow.state === 'removed') return null;

  const strokeColor = arrow.state === 'blocked' ? theme.colors.error : isHinted || arrow.state === 'hinted' ? theme.colors.accent : '#1B1E22';
  const strokeWidth = Math.max(2.1, cellSize * 0.095);

  return (
    <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, animatedStyle]}>
      <Svg width={boardSize} height={boardSize} viewBox={`0 0 ${boardSize} ${boardSize}`}>
        <Path
          d={geometry.linePath}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(18, cellSize * 0.72)}
          strokeLinecap="round"
          strokeLinejoin="round"
          onPress={() => onPress(arrow.id)}
        />
        <Path d={geometry.linePath} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        <Path d={geometry.headPath} fill={strokeColor} onPress={() => onPress(arrow.id)} />
        {debug ? (
          <SvgText x={boardPadding + geometry.label.col * cellSize + 4} y={boardPadding + geometry.label.row * cellSize + 14} fill={theme.colors.secondary} fontSize="8">
            {arrow.id}
          </SvgText>
        ) : null}
      </Svg>
    </Animated.View>
  );
});

ArrowPiece.displayName = 'ArrowPiece';
