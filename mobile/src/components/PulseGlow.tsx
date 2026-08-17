import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';

interface Props {
  color: string;
  size?: number;
  style?: ViewStyle;
}

export default function PulseGlow({ color, size = 90, style }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 1400, easing: Easing.in(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + progress.value * 0.35,
    transform: [{ scale: 0.85 + progress.value * 0.25 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.glow,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        animatedStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
  },
});
