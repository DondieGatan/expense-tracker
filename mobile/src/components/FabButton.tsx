import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { withAlpha } from '../theme/colors';
import AnimatedPressable from './AnimatedPressable';
import { PlusIcon } from './icons';

const SIZE = 56;

interface Props {
  onPress: () => void;
}

// One soft ring that grows out of the button and fades away, then rests before the next one. Two of them, offset by
// half a cycle, read as a slow, calm "breathing" rather than a flashing disc.
function Ripple({ color, delay }: { color: string; delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2600, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 0 }),
          withTiming(0, { duration: 500 }),
        ),
        -1,
        false,
      ),
    );
  }, [progress, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: (1 - progress.value) * 0.5,
    transform: [{ scale: 1 + progress.value * 0.65 }],
  }));

  return <Animated.View style={[styles.ripple, { borderColor: color }, style, { pointerEvents: 'none' }]} />;
}

// The centre "add expense" button of the tab bar: a lime orb with a soft glow, two slow ripples, and a plus that
// turns a quarter-turn while it is pressed. Ripples stop entirely when the device asks for reduced motion.
export default function FabButton({ onPress }: Props) {
  const { colors, isDark } = useTheme();
  const reduceMotion = useReducedMotion();
  const turn = useSharedValue(0);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value}deg` }] }));

  const rippleColor = isDark ? colors.accent : colors.heroFrom;

  return (
    <View style={styles.wrap}>
      {reduceMotion ? null : (
        <>
          <Ripple color={rippleColor} delay={0} />
          <Ripple color={rippleColor} delay={1550} />
        </>
      )}
      <AnimatedPressable
        scaleTo={0.9}
        onPress={onPress}
        onPressIn={() => { turn.value = withSpring(90, { damping: 14, stiffness: 220 }); }}
        onPressOut={() => { turn.value = withSpring(0, { damping: 12, stiffness: 180 }); }}
        accessibilityRole="button"
        accessibilityLabel="Add expense"
      >
        <LinearGradient
          colors={[colors.accent, colors.accentStrong]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[styles.orb, { boxShadow: `0px 8px 22px ${withAlpha(isDark ? colors.accent : colors.heroFrom, isDark ? 0.4 : 0.45)}` }]}
        >
          <LinearGradient
            colors={[isDark ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.14)', 'rgba(255,255,255,0)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.65 }}
            style={styles.sheen}
          />
          <Animated.View style={iconStyle}>
            <PlusIcon size={24} color={colors.accentContrast} />
          </Animated.View>
        </LinearGradient>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center', marginTop: -30 },
  ripple: {
    position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 1.5,
  },
  orb: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sheen: { position: 'absolute', top: 0, left: 0, right: 0, height: SIZE },
});
