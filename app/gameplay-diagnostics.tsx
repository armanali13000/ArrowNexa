import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { GameBoard } from '../components/game/GameBoard';
import { AppBackground } from '../components/layout/AppBackground';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Button } from '../components/ui/Button';
import { Text } from '../components/ui/Text';
import { diagnosticBoard } from '../engine/levels/diagnosticBoard';
import { PuzzleArrow } from '../engine/types/game';
import { audioService } from '../services/audio/audioService';
import { hapticsService } from '../services/haptics/hapticsService';

const clone = () => diagnosticBoard.arrows.map((arrow) => ({ ...arrow, path: [...arrow.path], state: 'normal' as const }));

export default function GameplayDiagnosticsScreen() {
  const [arrows, setArrows] = useState<PuzzleArrow[]>(clone);
  const sampleIds = useMemo(() => diagnosticBoard.arrows.slice(0, 4).map((arrow) => arrow.id), []);

  if (!__DEV__) {
    return (
      <AppBackground>
        <ScreenHeader title="Diagnostics" subtitle="Unavailable" />
      </AppBackground>
    );
  }

  const animate = (arrowId: string) => {
    setArrows((current) => current.map((arrow) => (arrow.id === arrowId ? { ...arrow, state: 'moving' } : { ...arrow, state: 'normal' })));
  };

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Gameplay Diagnostics" subtitle="Development only" />
        <View style={styles.boardWrap}>
          <GameBoard
            level={diagnosticBoard}
            arrows={arrows}
            debug
            onArrowPress={animate}
            onEscapeComplete={(arrowId) => setArrows((current) => current.map((arrow) => (arrow.id === arrowId ? { ...arrow, state: 'removed' } : arrow)))}
          />
        </View>
        <Text variant="heading2">Animation</Text>
        <View style={styles.row}>{sampleIds.map((id) => <Button key={id} title={id.replace('sample-', '')} variant="tool" onPress={() => animate(id)} />)}</View>
        <Button title="Reset Board" variant="tool" onPress={() => setArrows(clone())} />
        <Text variant="heading2">Audio</Text>
        <View style={styles.row}>
          <Button title="Tap" variant="tool" onPress={() => audioService.play('tap')} />
          <Button title="Escape" variant="tool" onPress={() => audioService.play('arrowMove')} />
          <Button title="Blocked" variant="tool" onPress={() => audioService.play('arrowBlocked')} />
          <Button title="Hint" variant="tool" onPress={() => audioService.play('hint')} />
          <Button title="Complete" variant="tool" onPress={() => audioService.play('levelComplete')} />
          <Button title="Menu Music" variant="tool" onPress={() => audioService.startMusic('menuMusic')} />
          <Button title="Game Music" variant="tool" onPress={() => audioService.startMusic('gameplayMusic')} />
          <Button title="Stop Music" variant="tool" onPress={() => audioService.stopMusic()} />
        </View>
        <Text variant="heading2">Haptics</Text>
        <View style={styles.row}>
          <Button title="Light" variant="tool" onPress={() => hapticsService.arrowSuccess()} />
          <Button title="Medium" variant="tool" onPress={() => hapticsService.booster()} />
          <Button title="Success" variant="tool" onPress={() => hapticsService.levelComplete()} />
          <Button title="Warning" variant="tool" onPress={() => hapticsService.lifeLost()} />
          <Button title="Error" variant="tool" onPress={() => hapticsService.blocked()} />
          <Button title="Selection" variant="tool" onPress={() => hapticsService.hint()} />
        </View>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, gap: 14, paddingBottom: 32 },
  boardWrap: { width: '100%' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
