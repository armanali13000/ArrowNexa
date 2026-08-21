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

  return (
    <View style={styles.wrapper} onLayout={(event) => setAvailableWidth(event.nativeEvent.layout.width)}>
      {boardSize > 0 ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`${level.title} puzzle board`} style={[styles.board, { width: boardSize, height: boardSize }]}>
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
                onPress={onArrowPress}
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
