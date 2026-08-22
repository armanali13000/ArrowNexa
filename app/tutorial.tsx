import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import { AppBackground } from '../components/layout/AppBackground';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Card } from '../components/ui/Card';
import { Text } from '../components/ui/Text';
import { createArrowHeadPath, createArrowSvgPath } from '../engine/geometry/rendering';
import { ArrowPieceData } from '../engine/types/game';
import { useTheme } from '../hooks/useTheme';
import { useAppCopy } from '../hooks/useAppCopy';

const steps = [
  'Every arrow has an exit direction.',
  'Tap an arrow to attempt to move it.',
  'An arrow can escape only when its path is clear.',
  'Other arrows may block the exit.',
  'Clear arrows in the correct order.',
  'Remove every arrow to complete the puzzle.',
  'Use hints if you get stuck.',
];

const tutorialArrow: ArrowPieceData = {
  id: 'tutorial',
  path: [{ row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 2 }],
  direction: 'DOWN',
  state: 'hinted',
};

export default function TutorialScreen() {
  const theme = useTheme();
  const { t } = useAppCopy();
  const cellSize = 44;
  const size = cellSize * 4;
  const linePath = createArrowSvgPath(tutorialArrow.path, cellSize, 0);
  const headPath = createArrowHeadPath(tutorialArrow.path, tutorialArrow.direction, cellSize, 0);
  return (
    <AppBackground>
      <ScreenHeader title={t('How to Play')} subtitle={t('A quick path-clearing guide')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.visualCard}>
          <Text variant="heading2">{t('Exit Paths')}</Text>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Rect x="0" y="0" width={size} height={size} rx="16" fill={theme.colors.boardBackground} />
            {Array.from({ length: 5 }, (_, index) => (
              <Line key={`v-${index}`} x1={index * cellSize} y1="0" x2={index * cellSize} y2={size} stroke={theme.colors.divider} />
            ))}
            {Array.from({ length: 5 }, (_, index) => (
              <Line key={`h-${index}`} x1="0" y1={index * cellSize} x2={size} y2={index * cellSize} stroke={theme.colors.divider} />
            ))}
            <Path d={linePath} fill="none" stroke={theme.colors.textPrimary} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <Path d={headPath} fill={theme.colors.accent} />
          </Svg>
        </Card>
        {steps.map((step, index) => (
          <Card key={step} style={styles.step}>
            <View style={[styles.stepIndex, { backgroundColor: theme.colors.primary }]}>
              <Text variant="caption" color="#FFFFFF">{index + 1}</Text>
            </View>
            <Text variant="body">{t(step)}</Text>
          </Card>
        ))}
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    gap: 12,
    paddingBottom: 34,
  },
  visualCard: {
    alignItems: 'center',
    gap: 14,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepIndex: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
