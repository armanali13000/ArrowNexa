import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { BrandLogo } from '../ui/BrandLogo';
import { Text } from '../ui/Text';
import { AppBackground } from './AppBackground';
import { useTheme } from '../../hooks/useTheme';
import { useAppCopy } from '../../hooks/useAppCopy';

export const SplashScreenView = () => {
  const scale = useSharedValue(0.96);
  const theme = useTheme();
  const { copy } = useAppCopy();

  useEffect(() => {
    scale.value = withRepeat(withSequence(withTiming(1.02, { duration: 650 }), withTiming(0.98, { duration: 650 })), -1, true);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AppBackground>
      <View style={styles.center}>
        <Animated.View entering={FadeIn.duration(260)} style={animatedStyle}>
          <BrandLogo size={116} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(120).duration(280)} style={styles.copy}>
          <Text variant="display" align="center">ArrowNexa</Text>
          <Text variant="title" color={theme.colors.textSecondary} align="center">{copy.homeSubtitle}</Text>
        </Animated.View>
      </View>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  copy: {
    marginTop: 18,
    gap: 6,
  },
});
