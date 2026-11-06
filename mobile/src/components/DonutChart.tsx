import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}

// A donut chart drawn from SVG stroke dashes: one arc per slice, a small gap between slices, the total in the middle.
export default function DonutChart({ slices, size = 170, thickness = 20, centerLabel, centerValue }: Props) {
  const { colors } = useTheme();
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const gap = slices.length > 1 ? 3 : 0;

  let offset = 0;
  const arcs = total > 0
    ? slices.map((slice) => {
        const length = (slice.value / total) * circumference;
        const arc = { ...slice, length: Math.max(length - gap, 0.5), offset };
        offset += length;
        return arc;
      })
    : [];

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.surface2} strokeWidth={thickness} fill="none" />
          {arcs.map((arc) => (
            <Circle
              key={arc.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={arc.color}
              strokeWidth={thickness}
              fill="none"
              strokeDasharray={`${arc.length} ${circumference - arc.length}`}
              strokeDashoffset={-arc.offset}
              strokeLinecap="butt"
            />
          ))}
        </G>
      </Svg>
      {centerValue ? (
        <View style={[styles.center, { pointerEvents: 'none' }]}>
          <Text style={[styles.centerValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{centerValue}</Text>
          {centerLabel ? <Text style={[styles.centerLabel, { color: colors.textMuted }]}>{centerLabel}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  centerValue: { fontSize: 15, fontWeight: '800' },
  centerLabel: { fontSize: 11, marginTop: 2 },
});
