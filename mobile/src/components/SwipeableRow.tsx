import React, { useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../theme/colors';
import { TrashIcon } from './icons';

interface Props {
  onDelete: () => void;
  children: React.ReactNode;
}

export default function SwipeableRow({ onDelete, children }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Swipeable
      renderRightActions={() => (
        <Animated.View entering={FadeIn.duration(150)} style={styles.action}>
          <TrashIcon size={18} color={colors.accentContrast} />
          <Text style={styles.actionText}>Delete</Text>
        </Animated.View>
      )}
      onSwipeableWillOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      onSwipeableOpen={onDelete}
      overshootRight={false}
    >
      {children}
    </Swipeable>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  action: {
    width: 88, backgroundColor: colors.danger, borderRadius: 16, marginBottom: 2,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  actionText: { color: colors.accentContrast, fontSize: 11, fontWeight: '700' },
});
