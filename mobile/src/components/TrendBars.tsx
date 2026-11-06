import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { formatCompact } from '../utils/format';
import type { MonthTotal } from '../api/types';

interface Props {
  data: MonthTotal[];
  height?: number;
}

// Six rounded bars, the current month highlighted with the accent gradient and its value shown on top.
export default function TrendBars({ data, height = 150 }: Props) {
  const { colors } = useTheme();
  const max = useMemo(() => Math.max(...data.map((d) => d.total), 1), [data]);
  const lastIndex = data.length - 1;

  return (
    <View style={styles.row}>
      {data.map((item, index) => {
        const isCurrent = index === lastIndex;
        const barHeight = Math.max((item.total / max) * (height - 34), item.total > 0 ? 6 : 3);
        return (
          <View key={`${item.label}-${index}`} style={styles.column}>
            <Text style={[styles.value, { color: isCurrent ? colors.text : colors.textMuted, opacity: item.total > 0 ? 1 : 0 }]} numberOfLines={1}>
              {formatCompact(item.total)}
            </Text>
            <View style={[styles.track, { height: height - 34 }]}>
              <Animated.View entering={FadeInUp.duration(450).delay(index * 60)} style={{ width: '100%', height: barHeight }}>
                {isCurrent ? (
                  <LinearGradient colors={[colors.accent, colors.accentStrong]} style={styles.bar} />
                ) : (
                  <View style={[styles.bar, { backgroundColor: colors.surface2 }]} />
                )}
              </Animated.View>
            </View>
            <Text style={[styles.label, { color: isCurrent ? colors.accent : colors.textMuted, fontWeight: isCurrent ? '800' : '600' }]}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 12 },
  column: { flex: 1, alignItems: 'center', gap: 6 },
  track: { width: '100%', justifyContent: 'flex-end' },
  bar: { flex: 1, borderRadius: 10, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  value: { fontSize: 10, fontWeight: '700' },
  label: { fontSize: 11 },
});
