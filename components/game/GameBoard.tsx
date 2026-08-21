import React, { memo, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { PuzzleArrow, PuzzleLevel } from '../../engine/types/game';
import { useTheme } from '../../hooks/useTheme';
import { ArrowPath } from './ArrowPath';

type Props = {
  level: PuzzleLevel;
  arrows: PuzzleArrow[];
  hintedArrowIds?: string[];
  debug?: boolean;
  onArrowPress: (arrowId: string) => void;
  onEscapeComplete: (arrowId: string) => void;
  onRestoreComplete?: (arrowId: string) => void;
};

export const GameBoard = memo(({ level, arrows, hintedArrowIds = [], debug = false, onArrowPress, onEscapeComplete, onRestoreComplete }: Props) => {
  const theme = useTheme();
  const [availableWidth, setAvailableWidth] = useState(0);
  const boardSize = Math.max(0, availableWidth);
  const boardPadding = boardSize * 0.035;
  const innerSize = Math.max(0, boardSize - boardPadding * 2);
  const cellSize = innerSize / level.size.cols;
  const gridLines = useMemo(() => Array.from({ length: level.size.cols + 1 }, (_, index) => index), [level.size.cols]);
  const pickArrowAt = (x: number, y: number) => {
    const candidates = arrows
      .filter((arrow) => arrow.state !== 'removed' && arrow.state !== 'moving' && arrow.state !== 'restoring')
      .map((arrow) => ({ arrow, distance: distanceToArrow(arrow, x, y, cellSize, boardPadding) }))
      .sort((left, right) => left.distance - right.distance);
    const nearest = candidates[0];
    if (!nearest) return;
    if (nearest.distance <= Math.max(24, cellSize * 0.48)) onArrowPress(nearest.arrow.id);
  };

  return (
    <View style={styles.wrapper} onLayout={(event) => setAvailableWidth(event.nativeEvent.layout.width)}>
      {boardSize > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${level.title} puzzle board`}
          onPress={(event) => pickArrowAt(event.nativeEvent.locationX, event.nativeEvent.locationY)}
          style={[styles.board, { width: boardSize, height: boardSize }]}
        >
          <Svg width={boardSize} height={boardSize} viewBox={`0 0 ${boardSize} ${boardSize}`}>
            <Rect x="0" y="0" width={boardSize} height={boardSize} rx="4" fill="#FFFFFF" opacity={0} />
            {debug
              ? gridLines.map((line) => (
                  <Line
                    key={`v-${line}`}
                    x1={boardPadding + line * cellSize}
                    y1={boardPadding}
                    x2={boardPadding + line * cellSize}
                    y2={boardSize - boardPadding}
                    stroke={theme.colors.divider}
                    strokeWidth="0.6"
                    opacity={0.65}
                  />
                ))
              : null}
            {debug
              ? gridLines.map((line) => (
                  <Line
                    key={`h-${line}`}
                    x1={boardPadding}
                    y1={boardPadding + line * cellSize}
                    x2={boardSize - boardPadding}
                    y2={boardPadding + line * cellSize}
                    stroke={theme.colors.divider}
                    strokeWidth="0.6"
                    opacity={0.65}
                  />
                ))
              : null}
          </Svg>
          {arrows
            .slice()
            .sort((left, right) => (left.order ?? 0) - (right.order ?? 0) || left.id.localeCompare(right.id))
            .map((arrow) => (
              <ArrowPath
                key={arrow.id}
                arrow={arrow}
                boardSize={boardSize}
                cellSize={cellSize}
                boardPadding={boardPadding}
                theme={theme}
                debug={debug}
                isHinted={hintedArrowIds.includes(arrow.id)}
                onEscapeComplete={onEscapeComplete}
                onRestoreComplete={onRestoreComplete}
              />
            ))}
        </Pressable>
      ) : null}
    </View>
  );
});

GameBoard.displayName = 'GameBoard';

const pointToPixel = (point: { row: number; col: number }, cellSize: number, boardPadding: number) => ({
  x: boardPadding + point.col * cellSize + cellSize / 2,
  y: boardPadding + point.row * cellSize + cellSize / 2,
});

const distanceToArrow = (arrow: PuzzleArrow, x: number, y: number, cellSize: number, boardPadding: number) => {
  const points = arrow.path.map((point) => pointToPixel(point, cellSize, boardPadding));
  if (points.length === 1) return Math.hypot(x - points[0].x, y - points[0].y);
  let minDistance = Number.POSITIVE_INFINITY;
  for (let index = 1; index < points.length; index += 1) {
    minDistance = Math.min(minDistance, distanceToSegment({ x, y }, points[index - 1], points[index]));
  }
  return minDistance;
};

const distanceToSegment = (point: { x: number; y: number }, start: { x: number; y: number }, end: { x: number; y: number }) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  const projection = { x: start.x + t * dx, y: start.y + t * dy };
  return Math.hypot(point.x - projection.x, point.y - projection.y);
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    aspectRatio: 1,
  },
  board: {
    backgroundColor: 'transparent',
    borderRadius: 4,
    overflow: 'visible',
  },
});
