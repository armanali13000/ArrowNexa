import React, { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { Card } from './Card';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

export const AppModal = ({ visible, onClose, children }: Props) => {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(120)} style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View entering={ZoomIn.duration(180)} style={styles.modal}>
          <Card style={{ backgroundColor: theme.colors.card }}>{children}</Card>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 12, 16, 0.52)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
  },
});
