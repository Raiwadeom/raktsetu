import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Colors } from '../constants/theme';
import BrandHeader from '../components/BrandHeader';

export default function SplashScreen() {
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.06, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.9, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [scale]);

  return (
    <View style={styles.container}>
      <BrandHeader
        theme="dark"
        logoSize={110}
        tagline="Connecting donors, saving lives"
        logoSource={require('../../assets/splash_logo.png')}
        logoAnimatedStyle={{ transform: [{ scale }] }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
});
