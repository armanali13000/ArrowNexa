import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { Theme } from '../../constants/theme';
import { createArrowHeadFillPath, createArrowSvgPath, getArrowStrokeWidth, getEscapeTranslation, getSnakeEscapeGeometry, getVisualDirectionFromPath } from '../../engine/geometry/rendering';
import { PuzzleArrow } from '../../engine/types/game';

type Props = {
  arrow: PuzzleArrow;
  boardSize: number;
  cellSize: number;
  boardPadding: number;
  theme: Theme;
  debug?: boolean;
  isHinted: boolean;
  onEscapeComplete: (arrowId: string) => void;
  onRestoreComplete?: (arrowId: string) => void;
};

export const ArrowPath = memo(({ arrow, boardSize, cellSize, boardPadding, theme, debug, isHinted, onEscapeComplete, onRestoreComplete }: Props) => {
  const strokeWidth = getArrowStrokeWidth(cellSize);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const shake = useSharedValue(0);
  const pulse = useSharedValue(1);
  const [snakeProgress, setSnakeProgress] = useState(0);
  const escapeReportedRef = useRef(false);
  const restoreReportedRef = useRef(false);
  const frameRef = useRef<number | undefined>(undefined);
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
    () => {
      const staticGeometry = {
        shaftPath: createArrowSvgPath(arrow.path, cellSize, boardPadding),
        headPath: createArrowHeadFillPath(arrow.path, visualDirection, cellSize, boardPadding, strokeWidth),
        exit: getEscapeTranslation(arrow.path, visualDirection, cellSize, boardPadding, boardSize),
        label: arrow.path[0],
        maxProgress: 0,
      };
      if (arrow.state !== 'moving') return staticGeometry;
      return {
        ...staticGeometry,
        ...getSnakeEscapeGeometry(arrow.path, visualDirection, snakeProgress, cellSize, boardPadding, boardSize, strokeWidth),
      };
    },
    [arrow.direction, arrow.path, arrow.state, boardPadding, boardSize, cellSize, snakeProgress, strokeWidth, visualDirection],
  );

  useEffect(() => {
    if (arrow.state === 'moving') {
      escapeReportedRef.current = false;
      const maxProgress = getSnakeEscapeGeometry(arrow.path, visualDirection, 0, cellSize, boardPadding, boardSize, strokeWidth).maxProgress;
      const duration = Math.min(1350, Math.max(850, maxProgress * 1.45));
      const startedAt = Date.now();
      pulse.value = withSequence(withTiming(1.02, { duration: 80 }), withTiming(1, { duration: 100 }));

      const tick = () => {
        const elapsed = Date.now() - startedAt;
        const linear = Math.min(1, elapsed / duration);
        const eased = linear < 0.5 ? 2 * linear * linear : 1 - Math.pow(-2 * linear + 2, 2) / 2;
        setSnakeProgress(maxProgress * eased);
        if (linear >= 1) {
          setSnakeProgress(maxProgress);
          reportEscape(arrow.id);
          return;
        }
        frameRef.current = requestAnimationFrame(tick);
      };

      setSnakeProgress(0);
      frameRef.current = requestAnimationFrame(tick);
      return () => {
        if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
        frameRef.current = undefined;
      };
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
      setSnakeProgress(0);
      translateX.value = withTiming(0, { duration: 90 });
      translateY.value = withTiming(0, { duration: 90 });
      opacity.value = withTiming(1, { duration: 90 });
      pulse.value = withTiming(1, { duration: 90 });
    }
    return () => {
      if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
      frameRef.current = undefined;
    };
  }, [arrow.id, arrow.path, arrow.state, boardPadding, boardSize, cellSize, opacity, pulse, reportEscape, reportRestore, strokeWidth, translateX, translateY, visualDirection]);

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
    transform: [{ translateX: (arrow.state === 'moving' ? 0 : translateX.value) + shake.value }, { translateY: arrow.state === 'moving' ? 0 : translateY.value }, { scale: pulse.value }],
  }));

  if (arrow.state === 'removed') return null;

  const color = arrow.state === 'blocked' ? '#E53935' : arrow.state === 'moving' ? '#159BE8' : isHinted || arrow.state === 'hinted' ? theme.colors.accent : '#061344';
  const touchStrokeWidth = Math.max(22, cellSize * 0.76);
  const glow = arrow.state === 'moving' || isHinted || arrow.state === 'hinted';

  return (
    <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, animatedStyle]}>
      <Svg width={boardSize} height={boardSize} viewBox={`0 0 ${boardSize} ${boardSize}`} pointerEvents="none">
        <Path d={geometry.shaftPath} fill="none" stroke="transparent" strokeWidth={touchStrokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        <Path d={geometry.headPath} fill="transparent" stroke="transparent" strokeWidth={touchStrokeWidth * 0.5} strokeLinecap="round" strokeLinejoin="round" />

        {glow ? <Path d={geometry.shaftPath} fill="none" stroke={color} strokeWidth={strokeWidth + 10} strokeLinecap="round" strokeLinejoin="round" opacity={arrow.state === 'moving' ? 0.28 : 0.12} /> : null}
        <Path d={geometry.shaftPath} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        <Path d={geometry.headPath} fill={color} stroke={color} strokeWidth={strokeWidth * 0.35} strokeLinecap="round" strokeLinejoin="round" />

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
