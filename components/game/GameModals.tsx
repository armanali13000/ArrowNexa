import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useGameStore } from '../../store/game/gameStore';
import { useAppCopy } from '../../hooks/useAppCopy';
import { AppModal } from '../ui/AppModal';
import { PrimaryButton, SecondaryButton, Button } from '../ui/Button';
import { Text } from '../ui/Text';

export const PauseModal = ({ onRestart }: { onRestart?: () => void }) => {
  const visible = useGameStore((state) => state.pauseVisible);
  const setVisible = useGameStore((state) => state.setPauseVisible);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const { t } = useAppCopy();
  return (
    <AppModal visible={visible} onClose={() => { setConfirmRestart(false); setVisible(false); }}>
      <View style={styles.stack}>
        {confirmRestart ? (
          <>
            <Text variant="heading2" align="center">{t('Restart Level?')}</Text>
            <Text variant="body" align="center">{t('Restarting resets this attempt. Used hints and boosters are not refunded.')}</Text>
            <PrimaryButton title={t('Cancel')} onPress={() => setConfirmRestart(false)} />
            <SecondaryButton title={t('Restart')} onPress={() => { setConfirmRestart(false); setVisible(false); onRestart?.(); }} />
          </>
        ) : (
          <>
            <Text variant="heading2" align="center">{t('Paused')}</Text>
            <PrimaryButton title={t('Resume')} onPress={() => setVisible(false)} />
            <SecondaryButton title={t('Restart')} onPress={() => setConfirmRestart(true)} />
            <Button title={t('Settings')} variant="tool" onPress={() => router.push('/settings')} />
            <Button title={t('How to Play')} variant="tool" onPress={() => router.push('/tutorial')} />
            <Button title={t('Exit to Menu')} variant="ghost" onPress={() => router.replace('/')} />
          </>
        )}
      </View>
    </AppModal>
  );
};

export const LevelCompleteModal = () => {
  const visible = useGameStore((state) => state.completeVisible);
  const setVisible = useGameStore((state) => state.setCompleteVisible);
  const { t } = useAppCopy();
  return (
    <AppModal visible={visible} onClose={() => setVisible(false)}>
      <View style={styles.stack}>
        <Text variant="heading1" align="center">{t('Level Complete')}</Text>
        <Text variant="body" align="center">{t('Stars')} 3 - {t('Moves')} 24 - {t('Time')} 01:18 - {t('Reward')} 1 {t('Hint')}</Text>
        <PrimaryButton title={t('Next')} onPress={() => setVisible(false)} />
        <SecondaryButton title={t('Replay')} onPress={() => setVisible(false)} />
        <Button title={t('Level Select')} variant="ghost" onPress={() => router.push('/levels')} />
      </View>
    </AppModal>
  );
};

export const LevelFailedModal = () => {
  const visible = useGameStore((state) => state.failedVisible);
  const setVisible = useGameStore((state) => state.setFailedVisible);
  const { t, copy } = useAppCopy();
  return (
    <AppModal visible={visible} onClose={() => setVisible(false)}>
      <View style={styles.stack}>
        <Text variant="heading1" align="center">{t('No Moves Left')}</Text>
        <Text variant="body" align="center">{copy.level} 12 - {t('Clear every arrow to finish the path.')}</Text>
        <PrimaryButton title={t('Retry')} onPress={() => setVisible(false)} />
        <SecondaryButton title={t('Use Hint')} onPress={() => setVisible(false)} />
        <Button title={t('Level Select')} variant="ghost" onPress={() => router.push('/levels')} />
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  stack: {
    gap: 14,
  },
});
