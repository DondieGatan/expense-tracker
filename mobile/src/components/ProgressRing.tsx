import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import DisplayText from './DisplayText';

interface Props {
  percent: number;          // 0..100+ (anything above 100 is drawn as a full ring in the warning colour)
  size?: number;
  thickness?: number;
  label?: string;
  sublabel?: string;
  over?: boolean;
}

let nextId = 0;

export default function ProgressRing({ percent, size = 120, thickness = 12, label, sublabel, over }: Props) {
  const { colors } = useTheme();
  const id = React.useMemo(() => `ring${nextId++}`, []);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(percent, 100));
  const dash = (clamped / 100) * circumference;
  const from = over ? colors.danger : colors.accent;
  const to = over ? colors.warn : colors.accent2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </SvgGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.surface2} strokeWidth={thickness} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${id})`}
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[styles.center, { pointerEvents: 'none' }]}>
        {label ? <DisplayText style={[styles.label, { color: over ? colors.danger : colors.text }]}>{label}</DisplayText> : null}
        {sublabel ? <Text style={[styles.sublabel, { color: colors.textMuted }]}>{sublabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 22, fontWeight: '800' },
  sublabel: { fontSize: 11, marginTop: 2 },
});
