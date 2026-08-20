import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useGameStore } from '../../store/game/gameStore';
import { AppModal } from '../ui/AppModal';
import { PrimaryButton, SecondaryButton, Button } from '../ui/Button';
import { Text } from '../ui/Text';

export const PauseModal = ({ onRestart }: { onRestart?: () => void }) => {
  const visible = useGameStore((state) => state.pauseVisible);
  const setVisible = useGameStore((state) => state.setPauseVisible);
  const [confirmRestart, setConfirmRestart] = useState(false);
  return (
    <AppModal visible={visible} onClose={() => { setConfirmRestart(false); setVisible(false); }}>
      <View style={styles.stack}>
        {confirmRestart ? (
          <>
            <Text variant="heading2" align="center">Restart Level?</Text>
            <Text variant="body" align="center">Restarting resets this attempt. Used hints and boosters are not refunded.</Text>
            <PrimaryButton title="Cancel" onPress={() => setConfirmRestart(false)} />
            <SecondaryButton title="Restart" onPress={() => { setConfirmRestart(false); setVisible(false); onRestart?.(); }} />
          </>
        ) : (
          <>
            <Text variant="heading2" align="center">Paused</Text>
            <PrimaryButton title="Resume" onPress={() => setVisible(false)} />
            <SecondaryButton title="Restart" onPress={() => setConfirmRestart(true)} />
            <Button title="Settings" variant="tool" onPress={() => router.push('/settings')} />
            <Button title="How to Play" variant="tool" onPress={() => router.push('/tutorial')} />
            <Button title="Exit to Menu" variant="ghost" onPress={() => router.replace('/')} />
          </>
        )}
      </View>
    </AppModal>
  );
};

export const LevelCompleteModal = () => {
  const visible = useGameStore((state) => state.completeVisible);
  const setVisible = useGameStore((state) => state.setCompleteVisible);
  return (
    <AppModal visible={visible} onClose={() => setVisible(false)}>
      <View style={styles.stack}>
        <Text variant="heading1" align="center">Level Complete!</Text>
        <Text variant="body" align="center">Stars 3 - Moves 24 - Time 01:18 - Reward 1 Hint</Text>
        <PrimaryButton title="Next Level" onPress={() => setVisible(false)} />
        <SecondaryButton title="Replay" onPress={() => setVisible(false)} />
        <Button title="Level Select" variant="ghost" onPress={() => router.push('/levels')} />
      </View>
    </AppModal>
  );
};

export const LevelFailedModal = () => {
  const visible = useGameStore((state) => state.failedVisible);
  const setVisible = useGameStore((state) => state.setFailedVisible);
  return (
    <AppModal visible={visible} onClose={() => setVisible(false)}>
      <View style={styles.stack}>
        <Text variant="heading1" align="center">No Moves Left</Text>
        <Text variant="body" align="center">Level 12 - Clear every arrow to finish the path.</Text>
        <PrimaryButton title="Retry" onPress={() => setVisible(false)} />
        <SecondaryButton title="Use Hint" onPress={() => setVisible(false)} />
        <Button title="Level Select" variant="ghost" onPress={() => router.push('/levels')} />
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  stack: {
    gap: 14,
  },
});
