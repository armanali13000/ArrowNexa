import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { AppBackground } from '../components/layout/AppBackground';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Text } from '../components/ui/Text';
import { generateLevelFromConfig } from '../engine/generator/generateLevel';
import { createGenerationConfig, createLevelSeed } from '../engine/levels/levelConfig';
import { createLevel } from '../engine/levels/levelFactory';
import { analyzeDifficulty } from '../engine/solver/difficulty';
import { solveLevel } from '../engine/solver/solveLevel';
import { useTheme } from '../hooks/useTheme';

export default function GeneratorDebugScreen() {
  const theme = useTheme();
  const [levelNumber, setLevelNumber] = useState('120');
  const [seed, setSeed] = useState(createLevelSeed(120));
  const [jsonVisible, setJsonVisible] = useState(false);
  const numericLevel = Math.max(1, Number(levelNumber) || 1);
  const level = useMemo(() => createLevel(numericLevel), [numericLevel]);
  const solver = useMemo(() => solveLevel(level), [level]);
  const metrics = useMemo(() => analyzeDifficulty(level), [level]);

  if (process.env.NODE_ENV === 'production') {
    return (
      <AppBackground>
        <ScreenHeader title="Generator" subtitle="Unavailable" />
        <View style={styles.content}>
          <Text variant="body">This screen is available only in development builds.</Text>
        </View>
      </AppBackground>
    );
  }

  const regenerate = () => {
    const nextSeed = `${seed}-next`;
    setSeed(nextSeed);
    const config = createGenerationConfig(numericLevel, nextSeed);
    generateLevelFromConfig(config, numericLevel);
  };

  return (
    <AppBackground>
      <ScreenHeader title="Generator" subtitle="Development only" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.stack}>
          <Text variant="heading2">Inputs</Text>
          <TextInput
            value={levelNumber}
            onChangeText={setLevelNumber}
            keyboardType="number-pad"
            style={[styles.input, { borderColor: theme.colors.divider, color: theme.colors.textPrimary }]}
          />
          <TextInput value={seed} onChangeText={setSeed} style={[styles.input, { borderColor: theme.colors.divider, color: theme.colors.textPrimary }]} />
          <View style={styles.actions}>
            <Button title="Generate" variant="tool" onPress={() => setSeed(createLevelSeed(numericLevel))} />
            <Button title="Regenerate" variant="tool" onPress={regenerate} />
            <Button title="Export JSON" variant="tool" onPress={() => setJsonVisible((visible) => !visible)} />
          </View>
        </Card>
        <Card style={styles.stack}>
          <Text variant="heading2">Analysis</Text>
          <Text variant="bodySmall">Seed: {level.seed}</Text>
          <Text variant="bodySmall">Score: {metrics.complexityScore.toFixed(1)}</Text>
          <Text variant="bodySmall">Density: {metrics.density.toFixed(2)}</Text>
          <Text variant="bodySmall">Arrows: {metrics.arrowCount}</Text>
          <Text variant="bodySmall">Solution: {solver.solutionLength ?? 0}</Text>
          <Text variant="bodySmall">Valid opening moves: {metrics.initialValidMoves}</Text>
          <Text variant="bodySmall">Dependency depth: {metrics.dependencyDepth}</Text>
          <Text variant="bodySmall">Attempts: {level.generationAttempts}</Text>
          <Text variant="bodySmall">Generated in: {level.generationDurationMs} ms</Text>
        </Card>
        {jsonVisible ? (
          <Card>
            <Text variant="caption">{JSON.stringify(level, null, 2)}</Text>
          </Card>
        ) : null}
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    gap: 14,
    paddingBottom: 34,
  },
  stack: {
    gap: 12,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
});
