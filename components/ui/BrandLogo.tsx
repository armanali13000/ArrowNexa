import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

type Props = {
  size?: number;
};

export const BrandLogo = ({ size = 92 }: Props) => {
  return (
    <View accessible accessibilityLabel="ArrowNexa logo" style={[styles.frame, { width: size, height: size, borderRadius: Math.max(18, size * 0.12) }]}>
      <Image source={require('../../assets/logo.png')} style={styles.image} resizeMode="cover" />
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
