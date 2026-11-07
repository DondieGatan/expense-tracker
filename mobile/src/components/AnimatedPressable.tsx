import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
}

// Small chips and icon buttons get a little invisible extra touch area (native) so they reach the ~44-48 pt comfortable
// tap size on phones; a screen can still pass its own hitSlop.
const DEFAULT_HIT_SLOP = { top: 6, bottom: 6, left: 4, right: 4 };

export default function AnimatedPressable({ children, style, scaleTo = 0.96, onPressIn, onPressOut, ...rest }: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressableBase
      style={[style, animatedStyle]}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, { damping: 16, stiffness: 320 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 12, stiffness: 220 });
        onPressOut?.(e);
      }}
      hitSlop={DEFAULT_HIT_SLOP}
      {...rest}
    >
      {children}
    </AnimatedPressableBase>
  );
}
